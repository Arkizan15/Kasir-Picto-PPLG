<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class LogoProcessor
{
    /**
     * Mengubah ukuran dan mengonversi gambar menjadi PNG 2 warna yang cocok untuk printer thermal 58mm.
     * Lebar 384px adalah standar maksimal resolusi cetak thermal roll 58mm.
     *
     * @param string $srcPath
     * @param int $targetWidth
     * @return string|null
     */
    public static function process(string $srcPath, int $targetWidth = 384): ?string
    {
        try {
            if (!file_exists($srcPath)) {
                Log::warning('[LogoProcessor] File sumber logo tidak ditemukan: ' . $srcPath);
                return null;
            }

            $info = getimagesize($srcPath);
            if ($info === false) {
                return null;
            }

            $mime = $info['mime'] ?? '';
            switch ($mime) {
                case 'image/png':
                    $img = imagecreatefrompng($srcPath);
                    break;
                case 'image/jpeg':
                case 'image/jpg':
                    $img = imagecreatefromjpeg($srcPath);
                    break;
                case 'image/gif':
                    $img = imagecreatefromgif($srcPath);
                    break;
                default:
                    Log::warning('[LogoProcessor] Format mime tidak didukung: ' . $mime);
                    return null;
            }

            $origW = imagesx($img);
            $origH = imagesy($img);
            if ($origW <= 0 || $origH <= 0) {
                return null;
            }

            $ratio = $origW / $origH;
            $newW = $targetWidth;
            $newH = (int) round($newW / $ratio);

            // Membuat kanvas truecolor baru untuk proses resize
            $resized = imagecreatetruecolor($newW, $newH);

            // Warp background putih untuk menghindari artefak transparansi/hitam pekat
            $white = imagecolorallocate($resized, 255, 255, 255);
            imagefill($resized, 0, 0, $white);

            imagealphablending($img, true);
            imagesavealpha($img, true);
            imagealphablending($resized, true);
            imagesavealpha($resized, false);

            imagecopyresampled($resized, $img, 0, 0, 0, 0, $newW, $newH, $origW, $origH);

            // Ubah gambar menjadi grayscale (keabu-abuan)
            imagefilter($resized, IMG_FILTER_GRAYSCALE);

            // Thresholding manual untuk mengubah gambar menjadi hitam-putih murni (1-bit monochrome)
            $threshold = 128;
            $width = imagesx($resized);
            $height = imagesy($resized);

            for ($x = 0; $x < $width; $x++) {
                for ($y = 0; $y < $height; $y++) {
                    $rgb = imagecolorat($resized, $x, $y);
                    $r = ($rgb >> 16) & 0xFF;
                    $g = ($rgb >> 8) & 0xFF;
                    $b = $rgb & 0xFF;

                    // Kalkulasi luminance sistem pencahayaan
                    $luminance = (0.299 * $r + 0.587 * $g + 0.114 * $b);

                    // Piksel di bawah threshold diubah menjadi hitam murni, di atas diubah menjadi putih murni
                    $newColor = $luminance < $threshold ? 0 : 255;
                    $color = imagecolorallocate($resized, $newColor, $newColor, $newColor);
                    imagesetpixel($resized, $x, $y, $color);
                }
            }

            // Kunci ke palet 2-warna tanpa dithering agar hasil print teks/garis logo tajam
            imagetruecolortopalette($resized, false, 2);

            $tmp = tempnam(sys_get_temp_dir(), 'logo_') . '.png';
            imagepng($resized, $tmp);

            imagedestroy($img);
            imagedestroy($resized);

            Log::info('[LogoProcessor] Berhasil memproses logo thermal printer: ' . $tmp);
            return $tmp;
        } catch (\Throwable $e) {
            Log::warning('[LogoProcessor] Pemrosesan gambar logo gagal: ' . $e->getMessage());
            return null;
        }
    }
}