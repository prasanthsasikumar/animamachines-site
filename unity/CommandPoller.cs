using UnityEngine;
using UnityEngine.Events;
using UnityEngine.Networking;
using System.Collections;
using GLTFast;

public class CommandPoller : MonoBehaviour
{
    // ── API Settings ──────────────────────────────────────────────
    [Header("API Settings")]
    [SerializeField] private string baseUrl = "https://anima.flowsxr.com";
    [SerializeField] private float pollInterval = 5f;
    [SerializeField] private string sessionId = "";

    // ── Visualization References ──────────────────────────────────
    [Header("Visualizations (assign in Inspector)")]
    [Tooltip("Mode 1 – Orb visualization")]
    [SerializeField] private GameObject orbVisualization;
    [Tooltip("Mode 2 – Personalized character container (auto-spawned from API)")]
    [SerializeField] private Transform characterParent;
    [Tooltip("Mode 3 – High-fidelity avatar")]
    [SerializeField] private GameObject avatarVisualization;

    // ── Setup Mode ────────────────────────────────────────────────
    [Header("Setup")]
    [Tooltip("Reference to the VendingMachineButtonHaandlers component for placement")]
    [SerializeField] private VendingMachineButtonHaandlers vendingMachineHandler;

    // ── Auto Mode ─────────────────────────────────────────────────
    [Header("Auto Mode")]
    [Tooltip("Seconds to stay on each mode during auto-cycle")]
    [SerializeField] private float autoModeDuration = 10f;

    // ── Events (unchanged) ────────────────────────────────────────
    [Header("Events")]
    public UnityEvent onStart;
    public UnityEvent onStop;
    public UnityEvent onReset;
    public UnityEvent<int> onMode;
    public UnityEvent<string> onAnswer;
    public UnityEvent<CommandResponse> onAnyCommand;
    public UnityEvent onMicOn;
    public UnityEvent onMicOff;

    // ── Private State ─────────────────────────────────────────────
    private Coroutine _pollCoroutine;
    private Coroutine _autoCoroutine;
    private int _currentMode = 0; // 0 = none, 1-3 = active mode
    private bool _setupMode = false;

    // Character model (Mode 2) – loaded from API
    private GameObject _characterInstance;
    private string _currentGlbUrl;
    private bool _characterLoaded = false;
    private bool _characterLoading = false;

    // ────────────────────────────────────────────────────────────────
    // Lifecycle
    // ────────────────────────────────────────────────────────────────
    void OnEnable()
    {
        _pollCoroutine = StartCoroutine(PollLoop());
    }

    void OnDisable()
    {
        if (_pollCoroutine != null)
            StopCoroutine(_pollCoroutine);
        StopAutoMode();
    }

    // ────────────────────────────────────────────────────────────────
    // API Polling (unchanged logic)
    // ────────────────────────────────────────────────────────────────
    IEnumerator PollLoop()
    {
        while (true)
        {
            yield return PollOnce();
            yield return new WaitForSeconds(pollInterval);
        }
    }

    IEnumerator PollOnce()
    {
        var url = $"{baseUrl}/api/augmented-humans/commands/latest";
        if (!string.IsNullOrEmpty(sessionId))
            url += $"?session_id={UnityWebRequest.EscapeURL(sessionId)}";

        using var request = UnityWebRequest.Get(url);
        yield return request.SendWebRequest();

        if (request.result != UnityWebRequest.Result.Success)
        {
            Debug.LogWarning($"[CommandPoller] Poll failed: {request.error}");
            yield break;
        }

        var body = request.downloadHandler.text;
        if (string.IsNullOrEmpty(body) || body.Contains("\"command\":null") || body.Contains("\"command\": null"))
            yield break;

        var cmd = JsonUtility.FromJson<CommandResponse>(body);
        if (string.IsNullOrEmpty(cmd.command))
            yield break;

        cmd.payloadRaw = ExtractPayload(body);

        Debug.Log($"[CommandPoller] Received: {cmd.command} | {cmd.payloadRaw}");

        onAnyCommand?.Invoke(cmd);

        switch (cmd.command)
        {
            case "start":
                HandleStart();
                onStart?.Invoke();
                break;
            case "stop":
                HandleStop();
                onStop?.Invoke();
                break;
            case "reset":
                HandleReset();
                onReset?.Invoke();
                break;
            case "mode":
                int mode = ExtractInt(cmd.payloadRaw, "mode", 1);
                HandleMode(mode);
                onMode?.Invoke(mode);
                break;
            case "answer":
                string answer = ExtractString(cmd.payloadRaw, "answer");
                onAnswer?.Invoke(answer);
                break;
            case "auto":
                ToggleAutoMode();
                break;
            case "setup":
                ToggleSetupMode();
                break;
            case "load_character":
                LoadCharacterModel();
                break;
            case "mic_on":
                HandleMicOn();
                break;
            case "mic_off":
                HandleMicOff();
                break;
        }

        yield return Acknowledge(cmd.id);
    }

    IEnumerator Acknowledge(string commandId)
    {
        if (string.IsNullOrEmpty(commandId))
            yield break;

        var url = $"{baseUrl}/api/augmented-humans/commands/{commandId}";

        using var request = UnityWebRequest.Put(url, "{}");
        request.method = "PATCH";
        request.SetRequestHeader("Content-Type", "application/json");
        yield return request.SendWebRequest();

        if (request.result != UnityWebRequest.Result.Success)
            Debug.LogWarning($"[CommandPoller] Ack failed: {request.error}");
    }

    // ────────────────────────────────────────────────────────────────
    // Demo State Handlers
    // ────────────────────────────────────────────────────────────────

    /// <summary>Start demo: hide everything, then show Mode 1 by default.</summary>
    public void HandleStart()
    {
        StopAutoMode();
        _setupMode = false;
        HideAll();
        SetMode(1);
        Debug.Log("[CommandPoller] Demo started – Mode 1 (Orb) active.");
    }

    /// <summary>Stop demo: hide all visualizations.</summary>
    public void HandleStop()
    {
        StopAutoMode();
        _setupMode = false;
        HideAll();
        _currentMode = 0;
        Debug.Log("[CommandPoller] Demo stopped.");
    }

    /// <summary>Reset demo: hide all, return to clean state.</summary>
    public void HandleReset()
    {
        StopAutoMode();
        _setupMode = false;
        HideAll();
        _currentMode = 0;
        Debug.Log("[CommandPoller] Demo reset to clean state.");
    }

    /// <summary>Switch to a specific mode (1-3).</summary>
    public void HandleMode(int mode)
    {
        _setupMode = false;
        SetMode(mode);
    }

    // ────────────────────────────────────────────────────────────────
    // Setup Mode – use VendingMachineButtonHaandlers placement
    // ────────────────────────────────────────────────────────────────

    /// <summary>Toggle setup mode so the user can place/reposition the vending machine.</summary>
    public void ToggleSetupMode()
    {
        StopAutoMode();
        _setupMode = !_setupMode;

        if (_setupMode)
        {
            HideAll();
            _currentMode = 0;
            Debug.Log("[CommandPoller] Setup mode ON – place the vending machine.");
        }
        else
        {
            Debug.Log("[CommandPoller] Setup mode OFF.");
        }
    }

    /// <summary>Call from a UI button to spawn/reposition the vending machine during setup.</summary>
    public void PlaceVendingMachine()
    {
        if (vendingMachineHandler != null)
        {
            vendingMachineHandler.OnSpawnVendingMachineClicked();
            Debug.Log("[CommandPoller] Vending machine placed via handler.");
        }
        else
        {
            Debug.LogWarning("[CommandPoller] VendingMachineButtonHaandlers reference is not assigned!");
        }
    }

    public bool IsSetupMode => _setupMode;

    // ────────────────────────────────────────────────────────────────
    // Microphone Handlers
    // ────────────────────────────────────────────────────────────────

    private void HandleMicOn()
    {
        onMicOn?.Invoke();
        Debug.Log("[CommandPoller] Microphone ON.");
    }

    private void HandleMicOff()
    {
        onMicOff?.Invoke();
        Debug.Log("[CommandPoller] Microphone OFF.");
    }

    // ────────────────────────────────────────────────────────────────
    // Auto Mode – cycle through modes automatically
    // ────────────────────────────────────────────────────────────────

    /// <summary>Toggle auto-cycle through Mode 1 → 2 → 3 → 1 …</summary>
    public void ToggleAutoMode()
    {
        if (_autoCoroutine != null)
        {
            StopAutoMode();
            Debug.Log("[CommandPoller] Auto mode stopped.");
        }
        else
        {
            _setupMode = false;
            _autoCoroutine = StartCoroutine(AutoModeLoop());
            Debug.Log($"[CommandPoller] Auto mode started ({autoModeDuration}s per mode).");
        }
    }

    private void StopAutoMode()
    {
        if (_autoCoroutine != null)
        {
            StopCoroutine(_autoCoroutine);
            _autoCoroutine = null;
        }
    }

    IEnumerator AutoModeLoop()
    {
        int mode = 1;
        while (true)
        {
            SetMode(mode);
            onMode?.Invoke(mode);
            yield return new WaitForSeconds(autoModeDuration);
            mode = (mode % 3) + 1; // cycles 1 → 2 → 3 → 1
        }
    }

    public bool IsAutoMode => _autoCoroutine != null;

    // ────────────────────────────────────────────────────────────────
    // Visualization Helpers
    // ────────────────────────────────────────────────────────────────

    private void SetMode(int mode)
    {
        HideAll();

        _currentMode = Mathf.Clamp(mode, 1, 3);

        switch (_currentMode)
        {
            case 1:
                SetActive(orbVisualization, true);
                Debug.Log("[CommandPoller] Mode 1 – Orb visualization active.");
                break;
            case 2:
                ShowCharacter();
                Debug.Log("[CommandPoller] Mode 2 – Personalized character active.");
                break;
            case 3:
                SetActive(avatarVisualization, true);
                Debug.Log("[CommandPoller] Mode 3 – High-fidelity avatar active.");
                break;
        }
    }

    private void HideAll()
    {
        SetActive(orbVisualization, false);
        HideCharacter();
        SetActive(avatarVisualization, false);
    }

    // ────────────────────────────────────────────────────────────────
    // Character Model Loading (Mode 2) – from AugmentedHumanLoader
    // ────────────────────────────────────────────────────────────────

    /// <summary>Fetch the latest augmented-human GLB and instantiate it under characterParent.</summary>
    public void LoadCharacterModel()
    {
        if (!_characterLoading)
            StartCoroutine(FetchAndLoadCharacter());
    }

    IEnumerator FetchAndLoadCharacter()
    {
        _characterLoading = true;

        using var request = UnityWebRequest.Get($"{baseUrl}/api/augmented-humans/latest");
        yield return request.SendWebRequest();

        if (request.result != UnityWebRequest.Result.Success)
        {
            Debug.LogWarning($"[CommandPoller] Character fetch failed: {request.error} – using fallback.");
            _characterLoading = false;
            ShowFallbackCharacter();
            yield break;
        }

        var body = request.downloadHandler.text;
        if (string.IsNullOrEmpty(body) || body.Contains("No augmented human found"))
        {
            Debug.Log("[CommandPoller] No augmented human found – using fallback.");
            _characterLoading = false;
            ShowFallbackCharacter();
            yield break;
        }

        var json = JsonUtility.FromJson<CharacterLatestResponse>(body);
        if (string.IsNullOrEmpty(json.glb_url))
        {
            _characterLoading = false;
            ShowFallbackCharacter();
            yield break;
        }

        // Skip reload if the same model is already loaded
        if (json.glb_url == _currentGlbUrl && _characterLoaded)
        {
            _characterLoading = false;
            yield break;
        }

        _currentGlbUrl = json.glb_url;

        var gltf = new GltfImport();
        var loadTask = gltf.Load(json.glb_url);
        yield return new WaitUntil(() => loadTask.IsCompleted);

        if (!loadTask.Result)
        {
            Debug.LogError($"[CommandPoller] Failed to load GLTF: {json.glb_url} – using fallback.");
            _characterLoading = false;
            ShowFallbackCharacter();
            yield break;
        }

        // Determine parent transform
        Transform parent = characterParent != null ? characterParent : transform;

        // Destroy previous character instance
        if (_characterInstance != null)
            Destroy(_characterInstance);

        _characterInstance = new GameObject("CharacterModel");
        _characterInstance.transform.SetParent(parent, false);

        gltf.InstantiateMainScene(_characterInstance.transform);

        // Hide fallback children now that we have the fetched model
        SetFallbackChildrenActive(false);

        // Play legacy animation if present
        var anim = _characterInstance.GetComponent<Animation>();
        if (anim != null)
        {
            if (anim.clip == null && anim.GetClipCount() > 0)
            {
                foreach (AnimationState state in anim)
                {
                    anim.clip = state.clip;
                    break;
                }
            }
            anim.Play();
        }

        _characterLoaded = true;
        _characterLoading = false;

        // Respect current mode – only show if Mode 2 is active
        _characterInstance.SetActive(_currentMode == 2);

        Debug.Log("[CommandPoller] Character model loaded.");
    }

    private void ShowCharacter()
    {
        if (_characterInstance != null)
        {
            _characterInstance.SetActive(true);
        }
        else if (!_characterLoading)
        {
            // Try to fetch from API; fallback is handled inside on failure
            StartCoroutine(FetchAndLoadCharacter());
        }
    }

    private void HideCharacter()
    {
        if (_characterInstance != null)
            _characterInstance.SetActive(false);
        SetFallbackChildrenActive(false);
    }

    /// <summary>Show pre-assigned children under characterParent as fallback when API fetch fails.</summary>
    private void ShowFallbackCharacter()
    {
        if (_currentMode == 2)
            SetFallbackChildrenActive(true);
    }

    /// <summary>Toggle visibility of any pre-existing children under characterParent (the fallback model).</summary>
    private void SetFallbackChildrenActive(bool active)
    {
        if (characterParent == null) return;
        foreach (Transform child in characterParent)
        {
            // Skip the dynamically loaded instance
            if (_characterInstance != null && child.gameObject == _characterInstance)
                continue;
            child.gameObject.SetActive(active);
        }
    }

    [System.Serializable]
    private class CharacterLatestResponse
    {
        public string session_id;
        public string glb_url;
        public string created_at;
    }

    private static void SetActive(GameObject go, bool state)
    {
        if (go != null)
            go.SetActive(state);
    }

    /// <summary>Current active mode (0 = none, 1 = orb, 2 = character, 3 = avatar).</summary>
    public int CurrentMode => _currentMode;

    // ────────────────────────────────────────────────────────────────
    // JSON helpers (unchanged)
    // ────────────────────────────────────────────────────────────────

    static string ExtractPayload(string json)
    {
        int start = json.IndexOf("\"payload\":");
        if (start < 0) return "{}";
        int braceStart = json.IndexOf('{', start);
        if (braceStart < 0) return "{}";
        int depth = 0;
        for (int i = braceStart; i < json.Length; i++)
        {
            if (json[i] == '{') depth++;
            else if (json[i] == '}') depth--;
            if (depth == 0)
                return json.Substring(braceStart, i - braceStart + 1);
        }
        return "{}";
    }

    static int ExtractInt(string json, string key, int fallback)
    {
        if (string.IsNullOrEmpty(json)) return fallback;
        string pattern = $"\"{key}\":";
        int start = json.IndexOf(pattern);
        if (start < 0) return fallback;
        start += pattern.Length;
        while (start < json.Length && json[start] == ' ') start++;
        int end = start;
        while (end < json.Length && char.IsDigit(json[end])) end++;
        return int.TryParse(json.Substring(start, end - start), out int result) ? result : fallback;
    }

    static string ExtractString(string json, string key)
    {
        if (string.IsNullOrEmpty(json)) return "";
        string pattern = $"\"{key}\":\"";
        int start = json.IndexOf(pattern);
        if (start < 0) return "";
        start += pattern.Length;
        int end = json.IndexOf("\"", start);
        return end < 0 ? "" : json.Substring(start, end - start);
    }

    [System.Serializable]
    public class CommandResponse
    {
        public string id;
        public string session_id;
        public string command;
        public string created_at;
        [System.NonSerialized] public string payloadRaw;
    }
}
