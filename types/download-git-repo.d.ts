declare module "download-git-repo" {
  type Callback = (err: Error | undefined) => void;

  function download(
    repo: string,
    dest: string,
    options: { clone: boolean },
    callback: Callback
  ): void;

  export = download;
}
