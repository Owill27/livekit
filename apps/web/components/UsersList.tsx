import { FC } from "react";
import { User } from "@/lib/types";
import useSWR from "swr";
import { getApiLink } from "@/lib/routing";

export type UserListProps = {
  me: User;
  call: (user: User) => void;
};

export const UsersList: FC<UserListProps> = ({ me, call }) => {
  const {
    data: users,
    isLoading,
    error,
  } = useSWR<User[]>(getApiLink("/users"), { refreshInterval: 3000 });

  if (isLoading) {
    return <div>Loading users</div>;
  }

  if (error && !users?.length) {
    return (
      <div>
        <div>An error occurred</div>
        <div>{JSON.stringify(error)}</div>
      </div>
    );
  }

  const filteredUsers = users?.filter((u) => u.id !== me.id);

  if (!filteredUsers?.length) {
    return <div>No online users</div>;
  }

  return (
    <div>
      <div>
        <div>{me.name} (Me)</div>
        <div>{me.location}</div>
      </div>

      <hr style={{ margin: "20px 0px" }} />

      {filteredUsers.map((u) => (
        <div key={u.id} style={{ marginTop: "20px" }}>
          <div>{u.name}</div>
          <div>{u.location}</div>
          <button onClick={() => call(u)}>Call</button>
        </div>
      ))}
    </div>
  );
};
