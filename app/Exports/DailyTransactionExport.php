<?php

namespace App\Exports;

use App\Models\Transaction;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class DailyTransactionExport implements WithMultipleSheets
{
    private $date;

    public function __construct($date = null)
    {
        $this->date = $date ? Carbon::parse($date)->toDateString() : today()->toDateString();
    }

    public function sheets(): array
    {
        return [
            new DailyTransactionItemSheet($this->date),
        ];
    }
}

class DailyTransactionItemSheet implements FromArray, WithTitle, WithStyles, WithEvents
{
    private $date;
    private $rowMap = [];

    public function __construct(string $date)
    {
        $this->date = Carbon::parse($date)->toDateString();
    }

    public function array(): array
    {
        $transactions = Transaction::with(['details.product', 'user'])
            ->whereDate('created_at', $this->date)
            ->orderBy('created_at', 'asc')
            ->get();

        $rows = [];
        $rows[] = ['Waktu', 'Invoice', 'Kasir', 'Produk', 'Qty', 'Harga Satuan', 'Subtotal'];

        foreach ($transactions as $transaction) {
            $this->rowMap['transaction_header_rows'][] = count($rows) + 1;

            $rows[] = [
                $transaction->created_at->format('H:i:s'),
                $transaction->invoice ?? $transaction->invoice_number ?? $transaction->id, // Menggunakan invoice jika ada
                $transaction->user->username ?? '-',
                '',
                '',
                '',
                '',
            ];

            foreach ($transaction->details as $detail) {
                $rows[] = [
                    '',
                    '',
                    '',
                    $detail->product->name ?? 'Deleted',
                    $detail->quantity,
                    $detail->price_at_transaction,
                    $detail->subtotal,
                ];
            }

            $rows[] = ['', '', '', '', '', '', ''];
        }


        $lastDataRow = count($rows);
        $grandTotalRow = $lastDataRow + 1;

        // Hitung grand total di sisi PHP agar nilai selalu akurat di Excel
        $grandTotal = 0;
        foreach ($transactions as $transaction) {
            foreach ($transaction->details as $detail) {
                $grandTotal += (float) $detail->subtotal;
            }
        }

        $rows[] = [
            'TOTAL PENJUALAN HARI INI',
            '',
            '',
            '',
            '',
            '',
            $grandTotal,
        ];

        $this->rowMap['grand_total_row'] = $grandTotalRow;
        $this->rowMap['data_end_row'] = $lastDataRow;

        return $rows;
    }

    public function title(): string
    {
        return 'Detail Item';
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FF4F4F4F'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet;
                $worksheet = $sheet->getDelegate();
                $grandTotalRow = $this->rowMap['grand_total_row'];
                $dataEndRow = $this->rowMap['data_end_row'];

                // Format Header Utama
                $sheet->getStyle('A1:G1')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF4F4F4F']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                ]);

                // Format Header Sub-Transaksi
                if (!empty($this->rowMap['transaction_header_rows'])) {
                    foreach ($this->rowMap['transaction_header_rows'] as $row) {
                        $sheet->getStyle("A{$row}:G{$row}")->applyFromArray([
                            'font' => ['bold' => true],
                            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF2F2F2']],
                            'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER],
                        ]);
                    }
                }

                // --- PERBAIKAN DI SINI ---
                // Menerapkan border tipis abu-abu ke seluruh tabel menggunakan applyFromArray agar tidak terjadi TypeError
                $sheet->getStyle("A1:G{$grandTotalRow}")->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => 'FFD3D3D3'],
                        ],
                    ],
                ]);

                // Set Alignment Data Kolom
                $sheet->getStyle("A2:C{$dataEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle("D2:D{$dataEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
                $sheet->getStyle("E2:E{$dataEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle("F2:G{$dataEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                // Format Akuntansi Angka Rupiah
                $numberFormat = '_("Rp"* #,##0_);_("Rp"* \\(#,##0\\);_("Rp"* "-"_);_(@_)';
                $sheet->getStyle("F2:G{$grandTotalRow}")->getNumberFormat()->setFormatCode($numberFormat);

                // Format Baris Grand Total Penjualan
                $sheet->mergeCells("A{$grandTotalRow}:F{$grandTotalRow}");
                $sheet->getStyle("A{$grandTotalRow}:G{$grandTotalRow}")->applyFromArray([
                    'font' => ['bold' => true, 'size' => 12],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_LEFT, 'vertical' => Alignment::VERTICAL_CENTER],
                    'borders' => [
                        'top' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['argb' => 'FF4F4F4F']
                        ],
                        'bottom' => [
                            'borderStyle' => Border::BORDER_DOUBLE,
                            'color' => ['argb' => 'FF4F4F4F']
                        ],
                    ]
                ]);

                // Dimensi Lebar Kolom
                $sheet->getColumnDimension('A')->setWidth(12);
                $sheet->getColumnDimension('B')->setWidth(24);
                $sheet->getColumnDimension('C')->setWidth(18);
                $sheet->getColumnDimension('D')->setWidth(38);
                $sheet->getColumnDimension('E')->setWidth(8);
                $sheet->getColumnDimension('F')->setWidth(18);
                $sheet->getColumnDimension('G')->setWidth(20);

                $worksheet->freezePane('A2');
            },
        ];
    }
}