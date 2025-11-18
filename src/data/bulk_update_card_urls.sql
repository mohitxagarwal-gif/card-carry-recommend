-- Bulk Update Credit Card Application URLs and Terms & Conditions URLs
-- Generated from credit_cards_updated.csv
-- Total cards to update: 112

BEGIN;

-- American Express Cards
UPDATE credit_cards SET application_url = 'https://www.americanexpress.com/in/credit-cards/', tnc_url = 'https://www.americanexpress.com/in/legal/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'amex-gold-charge';
UPDATE credit_cards SET application_url = 'https://www.americanexpress.com/in/credit-cards/', tnc_url = 'https://www.americanexpress.com/in/legal/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'amex-mrcc';
UPDATE credit_cards SET application_url = 'https://www.americanexpress.com/in/credit-cards/', tnc_url = 'https://www.americanexpress.com/in/legal/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'amex-platinum';
UPDATE credit_cards SET application_url = 'https://www.americanexpress.com/in/credit-cards/', tnc_url = 'https://www.americanexpress.com/in/legal/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'amex-platinum-reserve';
UPDATE credit_cards SET application_url = 'https://www.americanexpress.com/in/credit-cards/', tnc_url = 'https://www.americanexpress.com/in/legal/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'amex-platinum-travel';
UPDATE credit_cards SET application_url = 'https://www.americanexpress.com/in/credit-cards/', tnc_url = 'https://www.americanexpress.com/in/legal/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'amex-smartearn';

-- Axis Bank Cards
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-airtel';
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-ace';
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-atlas';
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-burgundy-private';
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-instaesy-fd-backed';
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-magnus';
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-myzone';
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-neo';
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-reserve';
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-select';
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-supermoney-rupay';
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-vistara-infinite';
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-flipkart';
UPDATE credit_cards SET application_url = 'https://www.axisbank.com/retail/cards/credit-card', tnc_url = 'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/mitc.pdf', updated_at = NOW() WHERE card_id = 'axis-freecharge';

-- AU Small Finance Bank Cards
UPDATE credit_cards SET application_url = 'https://www.aubank.in/credit-card', tnc_url = 'https://www.aubank.in/credit-card-terms-and-conditions', updated_at = NOW() WHERE card_id = 'au-altura';
UPDATE credit_cards SET application_url = 'https://www.aubank.in/credit-card', tnc_url = 'https://www.aubank.in/credit-card-terms-and-conditions', updated_at = NOW() WHERE card_id = 'au-altura-plus';
UPDATE credit_cards SET application_url = 'https://www.aubank.in/credit-card', tnc_url = 'https://www.aubank.in/credit-card-terms-and-conditions', updated_at = NOW() WHERE card_id = 'au-lit';
UPDATE credit_cards SET application_url = 'https://www.aubank.in/credit-card', tnc_url = 'https://www.aubank.in/credit-card-terms-and-conditions', updated_at = NOW() WHERE card_id = 'au-zenith';

-- BOB Financial Cards
UPDATE credit_cards SET application_url = 'https://www.bobcard.co.in', tnc_url = 'https://www.bobcard.co.in/terms-and-condition', updated_at = NOW() WHERE card_id = 'bob-uni-goldx';
UPDATE credit_cards SET application_url = 'https://www.onecard.co.in', tnc_url = 'https://www.onecard.co.in/terms-and-conditions', updated_at = NOW() WHERE card_id = 'onecard-metal-bob';

-- Canara Bank Cards
UPDATE credit_cards SET application_url = 'https://canarabank.com/credit-card', tnc_url = 'https://canarabank.com/credit-card-terms-and-conditions', updated_at = NOW() WHERE card_id = 'canara-rupay-select';

-- CSB Bank / Fintech Cards
UPDATE credit_cards SET application_url = 'https://www.jupiter.money', tnc_url = 'https://www.jupiter.money/terms', updated_at = NOW() WHERE card_id = 'jupiter-edge-csb';

-- Deutsche Bank Cards
UPDATE credit_cards SET application_url = 'https://www.db.com/india/', tnc_url = 'https://www.db.com/india/terms-and-conditions', updated_at = NOW() WHERE card_id = 'deutsche-bank-direct';

-- Fi.Money Cards
UPDATE credit_cards SET application_url = 'https://www.fi.money', tnc_url = 'https://www.fi.money/terms-and-conditions', updated_at = NOW() WHERE card_id = 'fi-money-csb-rupay';

-- HDFC Bank Cards
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-6e-rewards-xl';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-airtel-axis';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-biz-moneyback';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-biz-power';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-diners-black';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-diners-clubmiles';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-diners-privilege';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-freedom';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-indianoil';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-infinia';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-infinia-metal';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-millennia';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-moneyback';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-moneyback-plus';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-payzapp-iconia-amex';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-preferred-moneyback-amex';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-regalia';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-regalia-gold';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-shopper-stop-black';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-tata-neu-infinity';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-tata-neu-plus';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards', tnc_url = 'https://www.hdfcbank.com/content/api/contentstream-id/723fb80a-2dde-42a3-9793-7ae1be57c87f/48ad2c02-4a16-4044-bf2f-c2f1d4a224a3/Personal/Pay/Cards/Credit%20Card/Credit%20Cards/HDFC_Credit_Card_MITC.pdf', updated_at = NOW() WHERE card_id = 'hdfc-swiggy';

-- ICICI Bank Cards
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-amazon-pay';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-bpcl-octane';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-bpcl-octane-xl';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-coral';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-emeralde';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-hpcl-super-saver';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-iocl-coral';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-makemytrip-signature';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-manchester-united-signature';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-platinum-chip';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-rubyx';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-sapphiro';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'icici-titanium';
UPDATE credit_cards SET application_url = 'https://www.icicibank.com/personal-banking/cards/credit-card', tnc_url = 'https://www.icicibank.com/managed-assets/docs/personal/cards/mitc-credit-card.pdf', updated_at = NOW() WHERE card_id = 'flipkart-axis';

-- IDFC FIRST Bank Cards
UPDATE credit_cards SET application_url = 'https://www.idfcfirstbank.com/credit-card', tnc_url = 'https://www.idfcfirstbank.com/content/dam/IDFCFirstBank/help-and-support/Regulatory-Disclosures/Terms-and-conditions-Credit-card.pdf', updated_at = NOW() WHERE card_id = 'idfc-first-classic';
UPDATE credit_cards SET application_url = 'https://www.idfcfirstbank.com/credit-card', tnc_url = 'https://www.idfcfirstbank.com/content/dam/IDFCFirstBank/help-and-support/Regulatory-Disclosures/Terms-and-conditions-Credit-card.pdf', updated_at = NOW() WHERE card_id = 'idfc-first-club-vistara';
UPDATE credit_cards SET application_url = 'https://www.idfcfirstbank.com/credit-card', tnc_url = 'https://www.idfcfirstbank.com/content/dam/IDFCFirstBank/help-and-support/Regulatory-Disclosures/Terms-and-conditions-Credit-card.pdf', updated_at = NOW() WHERE card_id = 'idfc-first-select';
UPDATE credit_cards SET application_url = 'https://www.idfcfirstbank.com/credit-card', tnc_url = 'https://www.idfcfirstbank.com/content/dam/IDFCFirstBank/help-and-support/Regulatory-Disclosures/Terms-and-conditions-Credit-card.pdf', updated_at = NOW() WHERE card_id = 'idfc-first-wealth';

-- IndusInd Bank Cards
UPDATE credit_cards SET application_url = 'https://www.indusind.com/in/en/personal/cards/credit-cards.html', tnc_url = 'https://www.indusind.com/content/dam/indusind-corporate/MITC-Credit-Card-May-2023.pdf', updated_at = NOW() WHERE card_id = 'indusind-iconia-amex';
UPDATE credit_cards SET application_url = 'https://www.indusind.com/in/en/personal/cards/credit-cards.html', tnc_url = 'https://www.indusind.com/content/dam/indusind-corporate/MITC-Credit-Card-May-2023.pdf', updated_at = NOW() WHERE card_id = 'indusind-legend';
UPDATE credit_cards SET application_url = 'https://www.indusind.com/in/en/personal/cards/credit-cards.html', tnc_url = 'https://www.indusind.com/content/dam/indusind-corporate/MITC-Credit-Card-May-2023.pdf', updated_at = NOW() WHERE card_id = 'indusind-pinnacle';

-- Kotak Mahindra Bank Cards
UPDATE credit_cards SET application_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card.html', tnc_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'kotak-811';
UPDATE credit_cards SET application_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card.html', tnc_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'kotak-league-platinum';
UPDATE credit_cards SET application_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card.html', tnc_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'kotak-myntra';
UPDATE credit_cards SET application_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card.html', tnc_url = 'https://www.kotak.com/en/personal-banking/cards/credit-card/terms-and-conditions.html', updated_at = NOW() WHERE card_id = 'kotak-white-reserve';

-- Marquee / YES Bank Cards
UPDATE credit_cards SET application_url = 'https://www.yesbank.in/personal-banking/cards/credit-cards', tnc_url = 'https://www.yesbank.in/personal-banking/yes-bank-credit-card-terms-and-conditions', updated_at = NOW() WHERE card_id = 'yes-marquee';

-- Niyo / Equitas SFB Cards
UPDATE credit_cards SET application_url = 'https://www.goniyo.com', tnc_url = 'https://www.goniyo.com/terms-and-conditions', updated_at = NOW() WHERE card_id = 'niyo-equitas-global';

-- RBL Bank Cards
UPDATE credit_cards SET application_url = 'https://www.rblbank.com/credit-cards', tnc_url = 'https://www.rblbank.com/credit-cards/terms-and-conditions', updated_at = NOW() WHERE card_id = 'rbl-aurum';
UPDATE credit_cards SET application_url = 'https://www.rblbank.com/credit-cards', tnc_url = 'https://www.rblbank.com/credit-cards/terms-and-conditions', updated_at = NOW() WHERE card_id = 'rbl-bank-shoprite';
UPDATE credit_cards SET application_url = 'https://www.rblbank.com/credit-cards', tnc_url = 'https://www.rblbank.com/credit-cards/terms-and-conditions', updated_at = NOW() WHERE card_id = 'rbl-popcorn';

-- Scapia Cards
UPDATE credit_cards SET application_url = 'https://www.scapia.app', tnc_url = 'https://www.scapia.app/terms-and-conditions', updated_at = NOW() WHERE card_id = 'scapia';

-- SBI Card Cards
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-elite';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-octane';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-prime';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-pulse';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-simplysave';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'air-india-sbi-platinum';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'air-india-sbi-signature';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'bpcl-sbi-card-octane';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'irctc-sbi-card-platinum';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'irctc-sbi-card-premier';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'paytm-sbi-card';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'paytm-sbi-card-select';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'sbi-yono-sbi';
UPDATE credit_cards SET application_url = 'https://www.sbicard.com/en/personal/credit-cards.page', tnc_url = 'https://www.sbicard.com/en/personal/credit-card-terms-and-conditions.page', updated_at = NOW() WHERE card_id = 'simplyclick-sbi';

-- Standard Chartered Cards
UPDATE credit_cards SET application_url = 'https://www.sc.com/in/credit-cards/', tnc_url = 'https://www.sc.com/in/credit-cards/terms-and-conditions/', updated_at = NOW() WHERE card_id = 'standard-chartered-digismart';
UPDATE credit_cards SET application_url = 'https://www.sc.com/in/credit-cards/', tnc_url = 'https://www.sc.com/in/credit-cards/terms-and-conditions/', updated_at = NOW() WHERE card_id = 'standard-chartered-easyemi';
UPDATE credit_cards SET application_url = 'https://www.sc.com/in/credit-cards/', tnc_url = 'https://www.sc.com/in/credit-cards/terms-and-conditions/', updated_at = NOW() WHERE card_id = 'standard-chartered-manhattan';
UPDATE credit_cards SET application_url = 'https://www.sc.com/in/credit-cards/', tnc_url = 'https://www.sc.com/in/credit-cards/terms-and-conditions/', updated_at = NOW() WHERE card_id = 'standard-chartered-platinum-rewards';
UPDATE credit_cards SET application_url = 'https://www.sc.com/in/credit-cards/', tnc_url = 'https://www.sc.com/in/credit-cards/terms-and-conditions/', updated_at = NOW() WHERE card_id = 'standard-chartered-super-value-titanium';
UPDATE credit_cards SET application_url = 'https://www.sc.com/in/credit-cards/', tnc_url = 'https://www.sc.com/in/credit-cards/terms-and-conditions/', updated_at = NOW() WHERE card_id = 'standard-chartered-ultimate';

-- Tata Neu Cards (separate URLs)
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/tata-neu', tnc_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/tata-neu/terms-and-conditions', updated_at = NOW() WHERE card_id = 'tata-neu-hdfc-infinity';
UPDATE credit_cards SET application_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/tata-neu', tnc_url = 'https://www.hdfcbank.com/personal/pay/cards/credit-cards/tata-neu/terms-and-conditions', updated_at = NOW() WHERE card_id = 'tata-neu-hdfc-plus';

-- YES Bank Cards
UPDATE credit_cards SET application_url = 'https://www.yesbank.in/personal-banking/cards/credit-cards', tnc_url = 'https://www.yesbank.in/personal-banking/yes-bank-credit-card-terms-and-conditions', updated_at = NOW() WHERE card_id = 'yes-bank-prosperity-edge';
UPDATE credit_cards SET application_url = 'https://www.yesbank.in/personal-banking/cards/credit-cards', tnc_url = 'https://www.yesbank.in/personal-banking/yes-bank-credit-card-terms-and-conditions', updated_at = NOW() WHERE card_id = 'yes-prosperity-rewards-plus';
UPDATE credit_cards SET application_url = 'https://www.yesbank.in/personal-banking/cards/credit-cards', tnc_url = 'https://www.yesbank.in/personal-banking/yes-bank-credit-card-terms-and-conditions', updated_at = NOW() WHERE card_id = 'yes-reserv';

COMMIT;

-- Verification Query
-- Run this to confirm all updates were successful
SELECT 
  COUNT(*) as total_active_cards,
  COUNT(application_url) as cards_with_app_url,
  COUNT(tnc_url) as cards_with_tnc_url,
  COUNT(*) FILTER (WHERE application_url IS NULL) as missing_app_urls,
  COUNT(*) FILTER (WHERE tnc_url IS NULL) as missing_tnc_urls
FROM credit_cards
WHERE is_active = true;
