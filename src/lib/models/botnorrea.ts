interface ID {
  $oid: string;
}

interface AtedAt {
  $date: Date;
}

export interface User {
  _id?: ID | string;
  id: number | string;
  username: string;
  firstname?: string;
  lastname?: string;
  qrPathId?: string;
  createdAt?: AtedAt | string;
  updatedAt?: AtedAt | string;
}

export interface Crew {
  _id?: ID | string;
  name: string;
  members: Array<User>;
  createdAt?: AtedAt | string;
  updatedAt?: AtedAt | string;
}

export interface Command {
  _id?: ID | string;
  key: string;
  url: string;
  enabled: boolean;
  createdAt?: AtedAt | string;
  updatedAt?: AtedAt | string;
}

export interface GossipGroup {
  _id?: ID | string;
  id: number | string;
  enabled: boolean;
  createdAt?: AtedAt | string;
  updatedAt?: AtedAt | string;
}

export interface GossipMessage {
  _id?: ID | string;
  user: User;
  message: string;
  createdAt?: AtedAt | string;
  updatedAt?: AtedAt | string;
}
