using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using GLTFast;

public class AugmentedHumanLoader : MonoBehaviour
{
    [SerializeField] private string baseUrl = "https://anima.flowsxr.com";

    private string _currentGlbUrl;

    void Start()
    {
        StartCoroutine(FetchAndLoad());
    }

    IEnumerator FetchAndLoad()
    {
        using var request = UnityWebRequest.Get($"{baseUrl}/api/augmented-humans/latest");
        yield return request.SendWebRequest();

        if (request.result != UnityWebRequest.Result.Success)
        {
            Debug.LogWarning($"Fetch failed: {request.error}");
            yield break;
        }
        else if (string.IsNullOrEmpty(request.downloadHandler.text))
        {
            Debug.LogWarning("Empty response");
            yield break;
        }
        else if (request.downloadHandler.text.Contains("No augmented human found"))
        {
            Debug.Log("No augmented human found");
            yield break;
        }

        var json = JsonUtility.FromJson<LatestResponse>(request.downloadHandler.text);
        if (string.IsNullOrEmpty(json.glb_url) || json.glb_url == _currentGlbUrl)
            yield break;

        _currentGlbUrl = json.glb_url;
        var gltf = new GltfImport();
        var loadTask = gltf.Load(json.glb_url);
        yield return new WaitUntil(() => loadTask.IsCompleted);

        if (!loadTask.Result)
        {
            Debug.LogError($"Failed to load GLTF from URL: {json.glb_url}");
            yield break;
        }

        foreach (Transform child in transform) Destroy(child.gameObject);

        // Create a dedicated container for the model to keep the hierarchy clean
        var modelContainer = new GameObject("ModelContainer");
        modelContainer.transform.SetParent(transform, false);
        
        gltf.InstantiateMainScene(modelContainer.transform);
        
        // Try to play legacy animation if present
        var anim = modelContainer.GetComponent<Animation>();
        if (anim != null)
        {
             // If no default clip is assigned but we have clips, assign the first one
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
    }

    [System.Serializable]
    private class LatestResponse
    {
        public string session_id;
        public string glb_url;
        public string created_at;
    }
}