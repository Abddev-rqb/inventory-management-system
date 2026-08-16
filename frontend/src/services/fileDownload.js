export function downloadBlobFile({
  blob,
  fileName,
}) {
  if (!(blob instanceof Blob)) {
    throw new TypeError(
      "A Blob is required to download a file.",
    );
  }

  const safeFileName =
    sanitizeFileName(
      fileName ||
        "download.xlsx",
    );

  const objectUrl =
    URL.createObjectURL(blob);

  const downloadLink =
    document.createElement("a");

  downloadLink.href =
    objectUrl;

  downloadLink.download =
    safeFileName;

  downloadLink.style.display =
    "none";

  document.body.appendChild(
    downloadLink,
  );

  downloadLink.click();
  downloadLink.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(
      objectUrl,
    );
  }, 0);
}

export function getFileNameFromContentDisposition(
  contentDisposition,
) {
  if (
    !contentDisposition ||
    typeof contentDisposition !==
      "string"
  ) {
    return null;
  }

  const utf8Match =
    contentDisposition.match(
      /filename\*=UTF-8''([^;]+)/i,
    );

  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(
        utf8Match[1]
          .trim()
          .replace(/^["']|["']$/g, ""),
      );
    } catch {
      return utf8Match[1]
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }

  const normalMatch =
    contentDisposition.match(
      /filename="?([^";]+)"?/i,
    );

  return normalMatch?.[1]
    ?.trim() ?? null;
}

function sanitizeFileName(
  fileName,
) {
  return String(fileName)
    .replace(
      /[<>:"/\\|?*\u0000-\u001F]/g,
      "-",
    )
    .trim() ||
    "download.xlsx";
}