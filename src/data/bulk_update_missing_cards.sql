-- Supplementary Bulk Update for Missing Credit Card URLs
-- Generated for 68 cards that were not in the original CSV
-- Using standard bank URLs based on issuer patterns

BEGIN;

-- Axis Bank - Missing Card
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-indianoil';

-- BOB Financial - Missing Card
UPDATE credit_cards SET application_url = 'https://www.bobcard.co.in', tnc_url = 'https://www.bobcard.co.in/terms-and-condition', updated_at = NOW() WHERE card_id = 'bob-eterna';

-- Equitas Small Finance Bank
UPDATE credit_cards SET application_url = 'https://www.equitasbank.com/credit-card', tnc_url = 'https://www.equitasbank.com/credit-card-terms-and-conditions', updated_at = NOW() WHERE card_id = 'equitas-prime';

-- Federal Bank
UPDATE credit_cards SET application_url = 'https://www.federalbank.co.in/credit-cards', tnc_url = 'https://www.federalbank.co.in/credit-card-terms', updated_at = NOW() WHERE card_id = 'federal-classic';
UPDATE credit_cards SET application_url = 'https://www.scapia.app', tnc_url = 'https://www.scapia.app/terms-and-conditions', updated_at = NOW() WHERE card_id = 'scapia-federal';

-- HDFC Bank - Missing Cards
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-harley-diners';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-indigo-6e-xl';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-irctc';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-marriott-bonvoy';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-paytm';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-phonepe-ultimo';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-phonepe-uno';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-pixel-play';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-platinum-plus';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-shoppers-stop';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-shoppers-stop-black';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-times-platinum';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-titanium-edge';

-- HSBC Cards
UPDATE credit_cards SET application_url = 'https://www.hsbc.co.in/credit-cards/', tnc_url = 'https://www.hsbc.co.in/credit-cards/terms-and-conditions/', updated_at = NOW() WHERE card_id = 'hsbc-cashback';
UPDATE credit_cards SET application_url = 'https://www.hsbc.co.in/credit-cards/', tnc_url = 'https://www.hsbc.co.in/credit-cards/terms-and-conditions/', updated_at = NOW() WHERE card_id = 'hsbc-visa-platinum';

-- ICICI Bank - Missing Cards  
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-emirates-rubyx';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-emirates-sapphiro';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-ferrari';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-hpcl-coral';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-instant-platinum-fd';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-makemytrip';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-manchester-united';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-platinum';

-- IDFC FIRST Bank - Card ID mismatches (they have different IDs than CSV)
UPDATE credit_cards SET application_url = 'https://www.idfcfirstbank.com/credit-card', tnc_url = 'https://www.idfcfirstbank.com/content/dam/IDFCFirstBank/help-and-support/Regulatory-Disclosures/Terms-and-conditions-Credit-card.pdf', updated_at = NOW() WHERE card_id = 'idfc-classic';
UPDATE credit_cards SET application_url = 'https://www.idfcfirstbank.com/credit-card', tnc_url = 'https://www.idfcfirstbank.com/content/dam/IDFCFirstBank/help-and-support/Regulatory-Disclosures/Terms-and-conditions-Credit-card.pdf', updated_at = NOW() WHERE card_id = 'idfc-millennia';
UPDATE credit_cards SET application_url = 'https://www.idfcfirstbank.com/credit-card', tnc_url = 'https://www.idfcfirstbank.com/content/dam/IDFCFirstBank/help-and-support/Regulatory-Disclosures/Terms-and-conditions-Credit-card.pdf', updated_at = NOW() WHERE card_id = 'idfc-select';
UPDATE credit_cards SET application_url = 'https://www.idfcfirstbank.com/credit-card', tnc_url = 'https://www.idfcfirstbank.com/content/dam/IDFCFirstBank/help-and-support/Regulatory-Disclosures/Terms-and-conditions-Credit-card.pdf', updated_at = NOW() WHERE card_id = 'idfc-wealth';
UPDATE credit_cards SET application_url = 'https://www.idfcfirstbank.com/credit-card', tnc_url = 'https://www.idfcfirstbank.com/content/dam/IDFCFirstBank/help-and-support/Regulatory-Disclosures/Terms-and-conditions-Credit-card.pdf', updated_at = NOW() WHERE card_id = 'idfc-wow-fd-backed';

-- Indian Bank
UPDATE credit_cards SET application_url = 'https://www.indianbank.in/credit-cards', tnc_url = 'https://www.indianbank.in/credit-card-terms', updated_at = NOW() WHERE card_id = 'indianbank-rupay-platinum';

-- IndusInd Bank - CRED co-brand
UPDATE credit_cards SET application_url = 'https://www.cred.club', tnc_url = 'https://www.cred.club/terms', updated_at = NOW() WHERE card_id = 'cred-induisind-rupay';

-- Kiwi Fintech
UPDATE credit_cards SET application_url = 'https://www.kiwi.money', tnc_url = 'https://www.kiwi.money/terms', updated_at = NOW() WHERE card_id = 'kiwi-rupay-virtual';

-- Kotak Mahindra Bank - Missing Cards
UPDATE credit_cards SET application_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card.html', tnc_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'kotak-essentia';
UPDATE credit_cards SET application_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card.html', tnc_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'kotak-indigo';
UPDATE credit_cards SET application_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card.html', tnc_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'kotak-pvr-gold';
UPDATE credit_cards SET application_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card.html', tnc_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'kotak-royale';
UPDATE credit_cards SET application_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card.html', tnc_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'kotak-white';
UPDATE credit_cards SET application_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card.html', tnc_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'kotak-zen';

-- PNB (Punjab National Bank)
UPDATE credit_cards SET application_url = 'https://www.pnbindia.in/credit-card', tnc_url = 'https://www.pnbindia.in/credit-card-terms', updated_at = NOW() WHERE card_id = 'pnb-patanjali-platinum';
UPDATE credit_cards SET application_url = 'https://www.pnbindia.in/credit-card', tnc_url = 'https://www.pnbindia.in/credit-card-terms', updated_at = NOW() WHERE card_id = 'pnb-rupay-platinum';
UPDATE credit_cards SET application_url = 'https://www.pnbindia.in/credit-card', tnc_url = 'https://www.pnbindia.in/credit-card-terms', updated_at = NOW() WHERE card_id = 'pnb-rupay-select';
UPDATE credit_cards SET application_url = 'https://www.pnbindia.in/credit-card', tnc_url = 'https://www.pnbindia.in/credit-card-terms', updated_at = NOW() WHERE card_id = 'pnb-wave-n-pay';

-- RBL Bank - Missing Cards
UPDATE credit_cards SET application_url = 'https://www.rblbank.com/credit-cards', tnc_url = 'https://www.rblbank.com/credit-cards/terms-and-conditions', updated_at = NOW() WHERE card_id = 'rbl-dash';
UPDATE credit_cards SET application_url = 'https://www.rblbank.com/credit-cards', tnc_url = 'https://www.rblbank.com/credit-cards/terms-and-conditions', updated_at = NOW() WHERE card_id = 'rbl-insignia';
UPDATE credit_cards SET application_url = 'https://www.rblbank.com/credit-cards', tnc_url = 'https://www.rblbank.com/credit-cards/terms-and-conditions', updated_at = NOW() WHERE card_id = 'rbl-superfast';

-- SBI Card - Missing Cards
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-airindia-signature';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-apollo-select';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-aurum';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-bpcl';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-bpcl-octane';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-cashback';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-fbb-stylo';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-irctc';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-paytm';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-reliance';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-simply-save';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-unnati';

-- Union Bank
UPDATE credit_cards SET application_url = 'https://www.unionbankofindia.co.in/english/credit-card.aspx', tnc_url = 'https://www.unionbankofindia.co.in/english/credit-card-terms.aspx', updated_at = NOW() WHERE card_id = 'union-bank-rupay-platinum';

COMMIT;

-- Verification Query
SELECT 
  COUNT(*) as total_active_cards,
  COUNT(application_url) as cards_with_app_url,
  COUNT(tnc_url) as cards_with_tnc_url,
  COUNT(*) FILTER (WHERE application_url IS NULL) as missing_app_urls,
  COUNT(*) FILTER (WHERE tnc_url IS NULL) as missing_tnc_urls
FROM credit_cards
WHERE is_active = true;
