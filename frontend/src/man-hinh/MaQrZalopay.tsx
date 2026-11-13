'use client';

import { useMemo } from 'react';
import QRCode from '../vendor/qrcode/index.cjs';

export function MaQrZalopay({ value }: { value: string }) {
    const matrix = useMemo(() => {
        if (!value || value.length > 2048) return null;
        try {
            const qr = new QRCode(-1, 1); // Low error correction; EMV QR is ASCII.
            qr.addData(value);
            qr.make();
            return qr.modules;
        } catch {
            return null;
        }
    }, [value]);
    if (!matrix) return <p role="alert" className="text-red-700">Không thể tạo hình mã QR.</p>;
    const dimension = matrix.length + 8;
    const path: string[] = [];
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix.length; x++) {
            if (matrix[y][x]) path.push(`M${x + 4},${y + 4}h1v1h-1z`);
        }
    }
    return <svg role="img" aria-label="Mã QR thanh toán ZaloPay cho giao dịch hiện tại"
        viewBox={`0 0 ${dimension} ${dimension}`} width="320" height="320"
        className="mx-auto h-auto w-full max-w-[320px] rounded-lg border border-neutral-200 bg-white"
        shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
        <rect width={dimension} height={dimension} fill="#ffffff" />
        <path d={path.join('')} fill="#111111" />
    </svg>;
}
