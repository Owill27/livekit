import { FC, ReactNode, useMemo } from "react";
import { User } from "@/lib/types";
import useSWR from "swr";
import { getApiLink } from "@/lib/routing";
import styles from "./users-list.module.css";

export type UserListProps = {
  me: User;
  call: (user: User) => void;
};

export const UsersList: FC<UserListProps> = ({ me, call }) => {
  const {
    data: users,
    isLoading,
    mutate: refreshUsers,
    error,
  } = useSWR<User[]>(getApiLink("/users"), { refreshInterval: 3000 });

  const filteredUsers = useMemo(() => {
    return users?.filter((u) => u.id !== me.id) || [];
  }, [me.id, users]);

  let view: ReactNode = null;

  if (isLoading) {
    view = <div className={styles.loading}>Loading users...</div>;
  } else if (error && !users?.length) {
    view = (
      <div className={styles.error}>
        <p>An error occurred</p>
        <div>{JSON.stringify(error || "{}")}</div>
        <button onClick={() => refreshUsers()}>Retry</button>
      </div>
    );
  } else if (!filteredUsers?.length) {
    view = <div>No online users</div>;
  } else {
    view = (
      <div>
        {filteredUsers.map((u) => (
          <div
            key={u.id}
            style={{ marginTop: "20px" }}
            className={styles.userCard}
          >
            <div>
              <p>{u.name}</p>
              <div>{u.location}</div>
            </div>
            <button onClick={() => call(u)}>Call</button>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.me}>
        <div className={styles.myName}>{me.name} (Me)</div>
        <div>{me.location}</div>
      </div>

      <hr style={{ margin: "20px 0px" }} />
      {view}
    </div>
  );
};
