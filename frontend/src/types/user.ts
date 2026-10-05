export type User = {
    id: number;
    login: string;
};

export type AuthResponse = {
    accessToken: string;
    user: User;
};
