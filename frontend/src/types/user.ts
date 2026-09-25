export type User = {
    id: number;
    login: string;
    password?: string;
};

export type AuthResponse = {
    accessToken: string;
    user: User;
};
