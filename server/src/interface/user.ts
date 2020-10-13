/**
 * @description User-Service parameters
 */
export interface IUserOptions {
    userId: string
    password: string
}
/**
 * @description User-Service Info
 */
export interface IUserResult {
    userId: string,
    playerId: string,
    role: string,
    loginIp: string,
    password: string
}

/**
 * @description User-Service response
 */
export interface IUserResponse {
    msg: string,
    code: number,
    data: IUserResult | string
}

/**
 * @description User-Service abstractions
 */
export interface IUserService {
    getUser(options: IUserOptions): Promise<IUserResponse>;
}
