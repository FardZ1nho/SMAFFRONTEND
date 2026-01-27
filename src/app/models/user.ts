export interface User {
  id: number;
  username: string;
  enabled: boolean;
  roles?: Role[];
}

export interface Role {
  id: number;
  rol: string;
}