/**
 * 2024 yılı verilerine göre brüt maaştan yasal kesintileri ve net maaşı hesaplar.
 * Bu hesaplama basitleştirilmiştir ve kümülatif vergi matrahı, AGİ gibi özel durumları içermez.
 *
 * @param {number} grossSalary - Aylık brüt maaş.
 * @returns {object} - Hesaplanan tüm yasal kesintileri ve net maaşı içeren bir obje.
 */
function calculateLegalDeductions(grossSalary) {
  if (!grossSalary || grossSalary <= 0) {
    return {
      sgkWorkerShare: 0,
      unemploymentWorkerShare: 0,
      incomeTaxBase: 0,
      incomeTax: 0,
      stampDuty: 0,
      totalLegalDeductions: 0,
      netSalary: 0,
    };
  }

  // 2024 Asgari Ücret Verileri ve İstisnalar
  const INCOME_TAX_EXEMPTION_AMOUNT = 2550.32;
  const STAMP_DUTY_EXEMPTION_AMOUNT = 151.82;

  // SGK ve İşsizlik Sigortası Kesintileri
  const sgkWorkerShare = grossSalary * 0.14;
  const unemploymentWorkerShare = grossSalary * 0.01;
  const totalSgkAndUnemployment = sgkWorkerShare + unemploymentWorkerShare;

  // Gelir Vergisi Matrahı
  const incomeTaxBase = grossSalary - totalSgkAndUnemployment;

  // Gelir Vergisi Hesaplaması (Aylık Dilimler - Basitleştirilmiş)
  let incomeTax = 0;
  if (incomeTaxBase > 0) {
    if (incomeTaxBase <= 9166.67) {
      // 110.000 / 12
      incomeTax = incomeTaxBase * 0.15;
    } else if (incomeTaxBase <= 19166.67) {
      // 230.000 / 12
      incomeTax = 9166.67 * 0.15 + (incomeTaxBase - 9166.67) * 0.2;
    } else {
      // Daha üst dilimler için basitleştirilmiş hesaplama
      incomeTax =
        9166.67 * 0.15 + 10000 * 0.2 + (incomeTaxBase - 19166.67) * 0.27;
    }
  }

  // Damga Vergisi
  const stampDuty = grossSalary * 0.00759;

  // İstisnaları Uygula
  const finalIncomeTax = Math.max(0, incomeTax - INCOME_TAX_EXEMPTION_AMOUNT);
  const finalStampDuty = Math.max(0, stampDuty - STAMP_DUTY_EXEMPTION_AMOUNT);

  // Toplam Yasal Kesintiler
  const totalLegalDeductions =
    totalSgkAndUnemployment + finalIncomeTax + finalStampDuty;

  // Net Maaş
  const netSalary = grossSalary - totalLegalDeductions;

  return {
    sgkWorkerShare,
    unemploymentWorkerShare,
    incomeTaxBase,
    incomeTax: finalIncomeTax,
    stampDuty: finalStampDuty,
    totalLegalDeductions,
    netSalary,
  };
}

module.exports = { calculateLegalDeductions };
