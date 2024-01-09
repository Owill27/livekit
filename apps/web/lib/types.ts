export type User = {
  id: string;
  name: string;
  location: string;
};

export type CallStatuses =
  | "DIALLING"
  | "ONGOING"
  | "ENDED"
  | "DECLINED"
  | "MISSED"
  | "ERROR";

export type Call = {
  id: string;
  caller: User;
  receiver: User;
  status: CallStatuses;
  errMsg?: string;
};
