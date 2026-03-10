const MESHY_BASE = "https://api.meshy.ai";

function getAuthHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export interface MeshyApiError {
  status: number;
  message?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw {
      status: res.status,
      message: (data as { message?: string }).message ?? res.statusText,
    } as MeshyApiError;
  }
  return data as T;
}

export interface TextTo3DCreateResult {
  result: string;
}

export async function createPreview(
  apiKey: string,
  prompt: string,
  options?: { pose_mode?: string }
): Promise<string> {
  const body = {
    mode: "preview",
    prompt,
    pose_mode: options?.pose_mode || "",
    ai_model: "meshy-5",
  };
  const res = await fetch(`${MESHY_BASE}/openapi/v2/text-to-3d`, {
    method: "POST",
    headers: getAuthHeaders(apiKey),
    body: JSON.stringify(body),
  });
  const data = await handleResponse<TextTo3DCreateResult>(res);
  return data.result;
}

export async function createRefine(
  apiKey: string,
  previewTaskId: string,
  options?: { texture_prompt?: string; enable_pbr?: boolean }
): Promise<string> {
  const body = {
    mode: "refine",
    preview_task_id: previewTaskId,
    texture_prompt: options?.texture_prompt,
    enable_pbr: options?.enable_pbr ?? false,
    ai_model: "meshy-5",
  };
  const res = await fetch(`${MESHY_BASE}/openapi/v2/text-to-3d`, {
    method: "POST",
    headers: getAuthHeaders(apiKey),
    body: JSON.stringify(body),
  });
  const data = await handleResponse<TextTo3DCreateResult>(res);
  return data.result;
}

export interface TextTo3DTaskResponse {
  id: string;
  status: string;
  progress: number;
  model_urls?: {
    glb?: string;
  };
  task_error?: { message: string };
}

export async function getTextTo3DStatus(
  apiKey: string,
  taskId: string
): Promise<TextTo3DTaskResponse> {
  const res = await fetch(
    `${MESHY_BASE}/openapi/v2/text-to-3d/${encodeURIComponent(taskId)}`,
    {
      headers: getAuthHeaders(apiKey),
    }
  );
  return handleResponse<TextTo3DTaskResponse>(res);
}

export interface ImageTo3DCreateResult {
  result: string;
}

export async function createImageTo3D(
  apiKey: string,
  imageUrl: string,
  options?: {
    texture_prompt?: string;
    texture_image_url?: string;
    pose_mode?: string;
    should_texture?: boolean;
  }
): Promise<string> {
  const body = {
    image_url: imageUrl,
    should_texture: options?.should_texture ?? true,
    texture_prompt: options?.texture_prompt,
    texture_image_url: options?.texture_image_url ?? imageUrl,
    pose_mode: options?.pose_mode ?? "t-pose",
    ai_model: "meshy-5",
  };
  const res = await fetch(`${MESHY_BASE}/openapi/v1/image-to-3d`, {
    method: "POST",
    headers: getAuthHeaders(apiKey),
    body: JSON.stringify(body),
  });
  const data = await handleResponse<ImageTo3DCreateResult>(res);
  return data.result;
}

export interface ImageTo3DTaskResponse {
  id: string;
  status: string;
  progress: number;
  model_urls?: {
    glb?: string;
  };
  task_error?: { message: string };
}

export async function getImageTo3DStatus(
  apiKey: string,
  taskId: string
): Promise<ImageTo3DTaskResponse> {
  const res = await fetch(
    `${MESHY_BASE}/openapi/v1/image-to-3d/${encodeURIComponent(taskId)}`,
    {
      headers: getAuthHeaders(apiKey),
    }
  );
  return handleResponse<ImageTo3DTaskResponse>(res);
}

export interface ImageToImageCreateResult {
  result: string;
}

export async function createImageToImage(
  apiKey: string,
  input: {
    prompt: string;
    reference_image_urls: string[];
    ai_model?: "nano-banana" | "nano-banana-pro";
    generate_multi_view?: boolean;
  }
): Promise<string> {
  const body = {
    ai_model: input.ai_model ?? "nano-banana",
    prompt: input.prompt,
    reference_image_urls: input.reference_image_urls,
    generate_multi_view: input.generate_multi_view ?? false,
  };

  const res = await fetch(`${MESHY_BASE}/openapi/v1/image-to-image`, {
    method: "POST",
    headers: getAuthHeaders(apiKey),
    body: JSON.stringify(body),
  });
  const data = await handleResponse<ImageToImageCreateResult>(res);
  return data.result;
}

export interface ImageToImageTaskResponse {
  id: string;
  status: string;
  progress: number;
  image_urls?: string[];
  task_error?: { message: string };
}

export async function getImageToImageStatus(
  apiKey: string,
  taskId: string
): Promise<ImageToImageTaskResponse> {
  const res = await fetch(
    `${MESHY_BASE}/openapi/v1/image-to-image/${encodeURIComponent(taskId)}`,
    {
      headers: getAuthHeaders(apiKey),
    }
  );
  return handleResponse<ImageToImageTaskResponse>(res);
}

export interface RigCreateResult {
  result: string;
}

export async function createRig(
  apiKey: string,
  input: { model_url?: string; input_task_id?: string; height_meters?: number }
): Promise<string> {
  const body: Record<string, unknown> = {};
  if (input.model_url) body.model_url = input.model_url;
  if (input.input_task_id) body.input_task_id = input.input_task_id;
  if (input.height_meters != null) body.height_meters = input.height_meters;

  const res = await fetch(`${MESHY_BASE}/openapi/v1/rigging`, {
    method: "POST",
    headers: getAuthHeaders(apiKey),
    body: JSON.stringify(body),
  });
  const data = await handleResponse<RigCreateResult>(res);
  return data.result;
}

export interface RigTaskResponse {
  id: string;
  status: string;
  progress: number;
  result?: {
    rigged_character_glb_url?: string;
    rigged_character_fbx_url?: string;
    basic_animations?: {
      walking_glb_url?: string;
      running_glb_url?: string;
    };
  };
  task_error?: { message: string };
}

export async function getRigStatus(
  apiKey: string,
  taskId: string
): Promise<RigTaskResponse> {
  const res = await fetch(
    `${MESHY_BASE}/openapi/v1/rigging/${encodeURIComponent(taskId)}`,
    {
      headers: getAuthHeaders(apiKey),
    }
  );
  return handleResponse<RigTaskResponse>(res);
}

const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 120;

export async function pollUntilDone(
  apiKey: string,
  taskType: "text-to-3d" | "rig",
  taskId: string
): Promise<{ status: string; glbUrl?: string }> {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    if (taskType === "text-to-3d") {
      const task = await getTextTo3DStatus(apiKey, taskId);
      if (task.status === "SUCCEEDED") {
        return {
          status: task.status,
          glbUrl: task.model_urls?.glb,
        };
      }
      if (task.status === "FAILED" || task.status === "CANCELED") {
        throw {
          status: 500,
          message: task.task_error?.message ?? task.status,
        } as MeshyApiError;
      }
    } else {
      const task = await getRigStatus(apiKey, taskId);
      if (task.status === "SUCCEEDED") {
        return {
          status: task.status,
          glbUrl: task.result?.rigged_character_glb_url,
        };
      }
      if (task.status === "FAILED" || task.status === "CANCELED") {
        throw {
          status: 500,
          message: task.task_error?.message ?? task.status,
        } as MeshyApiError;
      }
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw {
    status: 504,
    message: "Task timed out",
  } as MeshyApiError;
}
