export const LOGO = {
  chinh: '/images/logo.png',
  favicon: '/images/logo.png',
  bannerTrangChu: '/images/logo.png',
};

export const ANH_MAC_DINH = '/images/caphesua.png';

export const ANH_MON_NUOC = {
  caPheSua: '/images/caphesua.png',
  americano: '/images/americano.png',
  cappuccino: '/images/capuchino.png',
  traDao: '/images/tradaocamsa.png',
  caPheMuoi: '/images/caphemuoi.png',
  caPheTrung: '/images/caphetrung.png',
  bacXiu: '/images/bacxiu.png',
  caPheCotDua: '/images/caphecotdua.png',
  caPheSuaTuoiSuongSao: '/images/capheden.png',
  traSenVang: '/images/trasenvang.png',
  traDaoCamSa: '/images/tradaocamsa.png',
  traVaiHoaHong: '/images/travaihoahong.png',
  traMangCau: '/images/tramangcau.png',
  traOLongNhanNhuc: '/images/trasenvang.png',
};

export function layDuongDanAnh(duongDan?: string): string {
  if (!duongDan || !duongDan.trim()) return '';
  const clean = duongDan.trim().replace(/\\/g, '/');
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:')) {
    return clean;
  }
  if (clean.startsWith('/public/')) {
    return clean.replace(/^\/public/, '');
  }
  if (clean.startsWith('public/')) {
    return '/' + clean.replace(/^public\//, '');
  }
  if (!clean.startsWith('/')) {
    return '/' + clean;
  }
  return clean;
}

export const HINH_ANH = {
  LOGO,
  ANH_MAC_DINH,
  ANH_MON_NUOC,
};
