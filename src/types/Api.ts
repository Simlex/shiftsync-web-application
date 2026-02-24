export enum ApiRequest {
  POST = "POST",
  GET = "GET",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

export type ApiResponse<T> = {
  // can be tweaked depending on the structure of the API's response
  status: "success" | "error";
  data?: T;
  error?: {
    message: string;
    errorType?: string;
    errorCode?: string;
    details?: any;
  };

  // because some responses may include a token e.g for authentication
  token?: string;
};
