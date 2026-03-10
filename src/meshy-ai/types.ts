export type MeshyTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELED";

export interface MeshyTextTo3DPreviewRequest {
  mode: "preview";
  prompt: string;
  model_type?: "lowpoly" | "standard";
  ai_model?: "latest" | "meshy-6" | "meshy-5";
  pose_mode?: "" | "t-pose" | "a-pose";
}

export interface MeshyTextTo3DRefineRequest {
  mode: "refine";
  preview_task_id: string;
  texture_prompt?: string;
  texture_image_url?: string;
  enable_pbr?: boolean;
  ai_model?: "latest" | "meshy-6" | "meshy-5";
}

export interface MeshyTextTo3DTask {
  id: string;
  type: "text-to-3d-preview" | "text-to-3d-refine";
  status: MeshyTaskStatus;
  progress: number;
  model_urls?: {
    glb?: string;
    fbx?: string;
    obj?: string;
  };
  prompt?: string;
  task_error?: { message: string };
}

export interface MeshyRiggingRequest {
  model_url?: string;
  input_task_id?: string;
  height_meters?: number;
  texture_image_url?: string;
}

export interface MeshyRiggingTaskResult {
  rigged_character_glb_url?: string;
  rigged_character_fbx_url?: string;
  basic_animations?: {
    walking_glb_url?: string;
    running_glb_url?: string;
  };
}

export interface MeshyRiggingTask {
  id: string;
  type: "rig";
  status: MeshyTaskStatus;
  progress: number;
  result?: MeshyRiggingTaskResult;
  task_error?: { message: string };
}
