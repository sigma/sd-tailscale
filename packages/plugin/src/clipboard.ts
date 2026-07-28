import { execFile } from "node:child_process";
import { platform } from "node:os";

/** Per-platform clipboard command; text is piped in on stdin. */
function clipboardCommand(): [string, string[]] {
  switch (platform()) {
    case "darwin":
      return ["pbcopy", []];
    case "win32":
      return ["clip", []];
    default:
      // X11; Wayland users can symlink wl-copy or adjust here.
      return ["xclip", ["-selection", "clipboard"]];
  }
}

/** Copy `text` to the OS clipboard by shelling out to the platform tool. */
export function copyToClipboard(text: string): Promise<void> {
  const [cmd, args] = clipboardCommand();
  return new Promise((resolve, reject) => {
    const child = execFile(cmd, args, (error) => (error ? reject(error) : resolve()));
    child.stdin?.end(text);
  });
}
