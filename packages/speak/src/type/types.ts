// eslint-disable-next-line @typescript-eslint/no-unused-vars
type VisionMessage = {
  role: Role;
  content: VisionContent;
};

type VisionContent = {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
};

export enum Role {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export type ModelResponse = {
  data: {
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }[];
};
