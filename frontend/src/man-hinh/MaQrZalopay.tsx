'use client';

import { useMemo } from 'react';
import QRCode from 'qrcode';

export function MaQrZalopay({ value, label = 'Mã QR thanh toán ZaloPay cho giao dịch hiện tại' }: {
    value: string;
    label?: string;
}) {
    const matrix = useMemo(() => {
        if (!value || value.length > 2048) return null;
        try {
            // Chỉ mã hóa đúng dữ liệu Backend cung cấp, không tự tạo URL thanh toán.
            const qr = QRCode.create(value, { errorCorrectionLevel: 'L' });
            return qr.modules;
        } catch {
            return null;
        }
    }, [value]);

    if (!matrix) {
        return <p role="alert" className="text-red-700">Không thể tạo hình mã QR.</p>;
    }

    // Quiet zone 4 ô mỗi cạnh giúp ứng dụng ZaloPay nhận diện QR ổn định.
    const dimension = matrix.size + 8;
    const path: string[] = [];
    for (let y = 0; y < matrix.size; y++) {
        for (let x = 0; x < matrix.size; x++) {
            if (matrix.data[y * matrix.size + x]) {
                path.push(`M${x + 4},${y + 4}h1v1h-1z`);
            }
        }
    }

    return <svg role="img" aria-label={label}
        viewBox={`0 0 ${dimension} ${dimension}`} width="320" height="320"
        className="mx-auto h-auto w-full max-w-[320px] rounded-lg border border-neutral-200 bg-white"
        shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
        <rect width={dimension} height={dimension} fill="#ffffff" />
        <path d={path.join('')} fill="#111111" />
    </svg>;
}
