import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { SWRConfig, BareFetcher } from "swr";

const swrFetcher: BareFetcher<any> = (resource, init) => {
  let url: string;
  if (Array.isArray(resource)) {
    url = resource[0];
  } else {
    url = resource;
  }

  return fetch(url, init).then(async (res) => {
    const isJson = Boolean(
      res.headers.get("Content-Type")?.includes("application/json")
    );

    const body = isJson ? await res.json() : res.body;

    if (res.ok) {
      return body;
    } else {
      throw body;
    }
  });
};

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SWRConfig value={{ fetcher: swrFetcher }}>
      <Component {...pageProps} />
    </SWRConfig>
  );
}
