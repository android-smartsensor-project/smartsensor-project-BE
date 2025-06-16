import { IsString } from "class-validator";

export class UserUidDto {
	@IsString()
	readonly uid: string;
}