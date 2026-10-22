import React from 'react';
import { Coffee, MapPin, Clock, Phone, Mail, Heart, Sparkles } from 'lucide-react';
import { HartzlerWordmark } from './HartzlerBrand';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full mt-12 bg-gradient-to-b from-stone-100/80 to-[#FAF9F5] border-t border-black/5 text-[#252525] pt-12 pb-24 md:pb-12">
      <div className="fluid-container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10 border-b border-black/5">
          {/* Brand Intro */}
          <div className="space-y-3">
            <HartzlerWordmark size="sm" />
            <p className="text-xs sm:text-sm text-[#252525]/75 leading-relaxed">
              Khởi đầu ngày mới tràn đầy năng lượng cùng ly cà phê rang mộc chuẩn vị, chiếc bánh nướng vàng thơm và kem gelato mát lạnh.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-[#145C4B] font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Cà phê mộc · Bánh tươi · Gelato tự nhiên</span>
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#145C4B] flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>Hệ Thống Cửa Hàng</span>
            </h4>
            <div className="space-y-2 text-xs text-[#252525]/80">
              <div>
                <p className="font-semibold text-[#252525]">Chi nhánh Quận 1</p>
                <p className="text-[#252525]/70">88 Nam Kỳ Khởi Nghĩa, Bến Nghé, Q.1, TP.HCM</p>
              </div>
              <div className="pt-1">
                <p className="font-semibold text-[#252525]">Chi nhánh Thảo Điền</p>
                <p className="text-[#252525]/70">26 Xuân Thủy, Thảo Điền, TP. Thủ Đức, TP.HCM</p>
              </div>
            </div>
          </div>

          {/* Working Hours & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#145C4B] flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Thời Gian Mở Cửa</span>
            </h4>
            <div className="space-y-1.5 text-xs text-[#252525]/80">
              <p className="flex justify-between">
                <span>Thứ 2 – Thứ 6:</span>
                <span className="font-semibold text-[#252525]">07:00 – 22:30</span>
              </p>
              <p className="flex justify-between">
                <span>Thứ 7 – Chủ Nhật:</span>
                <span className="font-semibold text-[#252525]">07:00 – 23:00</span>
              </p>
              <div className="pt-2 flex items-center gap-2 text-[#145C4B]">
                <Phone className="w-3.5 h-3.5" />
                <span className="font-bold">Hotline: 1900 6868</span>
              </div>
              <div className="flex items-center gap-2 text-[#252525]/70">
                <Mail className="w-3.5 h-3.5" />
                <span>hello@brewlite.vn</span>
              </div>
            </div>
          </div>

          {/* Amenities & Experience */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#145C4B] flex items-center gap-1.5">
              <Coffee className="w-4 h-4" />
              <span>Trải Nghiệm Tại Quán</span>
            </h4>
            <ul className="text-xs text-[#252525]/80 space-y-1.5 list-disc list-inside">
              <li>Wifi tốc độ cao & nhiều ổ cắm sạc</li>
              <li>Không gian máy lạnh yên tĩnh làm việc</li>
              <li>Khu vực ngoài trời thoáng mát</li>
              <li>Thanh toán chuyển khoản VietQR nhanh chóng</li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#252525]/60">
          <div>
            © {new Date().getFullYear()} <span className="font-bold text-[#145C4B]">BREW LITE</span>. Mọi quyền được bảo lưu.
          </div>
          <div className="flex items-center gap-1">
            <span>Được tạo với niềm đam mê cà phê & bánh nướng</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
