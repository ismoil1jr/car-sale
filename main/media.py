"""Media fayllarni HTTP Range bilan berish (iPhone/Safari video o'ynatishi uchun shart)."""
import mimetypes
import os
import re

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse
from django.utils._os import safe_join
from django.views.static import serve

RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)$")


def media_serve(request, path):
    try:
        full = safe_join(settings.MEDIA_ROOT, path)
    except Exception:
        raise Http404
    header = request.headers.get("Range", "")
    m = RANGE_RE.match(header.strip())
    if not m or not os.path.isfile(full):
        return serve(request, path, document_root=settings.MEDIA_ROOT)

    size = os.path.getsize(full)
    start_s, end_s = m.groups()
    if start_s:
        start = int(start_s)
        end = min(int(end_s), size - 1) if end_s else size - 1
    else:  # "bytes=-500" — oxirgi 500 bayt
        length = int(end_s or 0)
        start, end = max(0, size - length), size - 1
    if start >= size or start > end:
        resp = HttpResponse(status=416)
        resp["Content-Range"] = f"bytes */{size}"
        return resp

    f = open(full, "rb")
    f.seek(start)
    length = end - start + 1
    resp = FileResponse(_limited(f, length), status=206,
                        content_type=mimetypes.guess_type(full)[0] or "application/octet-stream")
    resp["Content-Length"] = str(length)
    resp["Content-Range"] = f"bytes {start}-{end}/{size}"
    resp["Accept-Ranges"] = "bytes"
    return resp


def _limited(f, length, chunk=64 * 1024):
    try:
        while length > 0:
            data = f.read(min(chunk, length))
            if not data:
                break
            length -= len(data)
            yield data
    finally:
        f.close()
