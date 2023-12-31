import { Inter } from "next/font/google";
import Head from "next/head";
import { FC, PropsWithChildren } from "react";

const inter = Inter({ subsets: ["latin"] });

interface Props {}

const BaseLayout: FC<PropsWithChildren<Props>> = (props) => {
  return (
    <>
      <Head>
        <title>Livekit Demo</title>
        <meta name="description" content="Livekit demo app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={inter.className}>{props.children}</div>
    </>
  );
};

export default BaseLayout;
