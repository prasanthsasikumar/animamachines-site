using UnityEngine;
using UnityEngine.Events;
using UnityEngine.Networking;
using System.Collections;

public class CommandPoller : MonoBehaviour
{
    [SerializeField] private string baseUrl = "https://anima.flowsxr.com";
    [SerializeField] private float pollInterval = 5f;
    [SerializeField] private string sessionId = "";

    [Header("Events")]
    public UnityEvent onStart;
    public UnityEvent onStop;
    public UnityEvent onReset;
    public UnityEvent<int> onMode;
    public UnityEvent<string> onAnswer;
    public UnityEvent<CommandResponse> onAnyCommand;

    private Coroutine _pollCoroutine;

    void OnEnable()
    {
        _pollCoroutine = StartCoroutine(PollLoop());
    }

    void OnDisable()
    {
        if (_pollCoroutine != null)
            StopCoroutine(_pollCoroutine);
    }

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

        // Extract payload manually since JsonUtility doesn't handle nested objects
        cmd.payloadRaw = ExtractPayload(body);

        Debug.Log($"[CommandPoller] Received: {cmd.command} | {cmd.payloadRaw}");

        onAnyCommand?.Invoke(cmd);

        switch (cmd.command)
        {
            case "start":
                onStart?.Invoke();
                break;
            case "stop":
                onStop?.Invoke();
                break;
            case "reset":
                onReset?.Invoke();
                break;
            case "mode":
                int mode = ExtractInt(cmd.payloadRaw, "mode", 1);
                onMode?.Invoke(mode);
                break;
            case "answer":
                string answer = ExtractString(cmd.payloadRaw, "answer");
                onAnswer?.Invoke(answer);
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
