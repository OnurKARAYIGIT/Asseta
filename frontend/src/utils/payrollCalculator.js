/**
 * 2024 yılı verilerine göre brüt maaştan yaklaşık net maaş hesaplar.
 * Bu hesaplama basitleştirilmiştir ve kümülatif vergi matrahı, AGİ,
 * engellilik indirimi gibi özel durumları içermez.
 * Yalnızca genel bir tahmin sunar.
 *
 * @param {number} grossSalary - Aylık brüt maaş.
 * @returns {number} - Tahmini aylık net maaş.
 */
export const calculateNetSalary = (grossSalary) => {
  if (!grossSalary || grossSalary <= 0) {
    return 0;
  }

  // 2024 Asgari Ücret Verileri ve İstisnalar
  const MINIMUM_WAGE_GROSS = 20002.5;
  const INCOME_TAX_EXEMPTION_AMOUNT = 2550.32; // Asgari ücretin gelir vergisi istisnası
  const STAMP_DUTY_EXEMPTION_AMOUNT = 151.82; // Asgari ücretin damga vergisi istisnası

  // SGK ve İşsizlik Sigortası Kesintileri
  const sgkWorkerShare = grossSalary * 0.14;
  const unemploymentWorkerShare = grossSalary * 0.01;
  const totalSgkAndUnemployment = sgkWorkerShare + unemploymentWorkerShare;

  // Gelir Vergisi Matrahı
  const incomeTaxBase = grossSalary - totalSgkAndUnemployment;

  // Gelir Vergisi Hesaplaması (Aylık Dilimler)
  let incomeTax = 0;
  if (incomeTaxBase > 0) {
    if (incomeTaxBase <= 9166.67) {
      // 110.000 / 12
      incomeTax = incomeTaxBase * 0.15;
    } else if (incomeTaxBase <= 19166.67) {
      // 230.000 / 12
      incomeTax = 9166.67 * 0.15 + (incomeTaxBase - 9166.67) * 0.2;
    } else if (incomeTaxBase <= 50000) {
      // 580.000 / 12 (basitleştirilmiş)
      incomeTax =
        9166.67 * 0.15 + 10000 * 0.2 + (incomeTaxBase - 19166.67) * 0.27;
    } else if (incomeTaxBase <= 258333.33) {
      // 3.100.000 / 12
      incomeTax =
        9166.67 * 0.15 +
        10000 * 0.2 +
        30833.33 * 0.27 +
        (incomeTaxBase - 50000) * 0.35;
    } else {
      incomeTax =
        9166.67 * 0.15 +
        10000 * 0.2 +
        30833.33 * 0.27 +
        208333.33 * 0.35 +
        (incomeTaxBase - 258333.33) * 0.4;
    }
  }

  // Damga Vergisi
  const stampDuty = grossSalary * 0.00759;

  // İstisnaları Uygula
  const finalIncomeTax = Math.max(0, incomeTax - INCOME_TAX_EXEMPTION_AMOUNT);
  const finalStampDuty = Math.max(0, stampDuty - STAMP_DUTY_EXEMPTION_AMOUNT);

  // Toplam Kesintiler
  const totalDeductions =
    totalSgkAndUnemployment + finalIncomeTax + finalStampDuty;

  // Net Maaş
  const netSalary = grossSalary - totalDeductions;

  return netSalary;
};
