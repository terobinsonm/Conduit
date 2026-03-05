import { Client, Option, SizeScale, Size, Product, Inventory, Customer } from "@prisma/client";

type Environment = "dev" | "uat" | "prod";

interface RepSparkConfig {
  baseUrl: string;
  clientKey: string;
  environmentKey: string;
}

interface LicensedConfigWithRelations {
  id: string;
  placement: string;
  colorChoice: string;
  finishedGoodName: string | null;
  finishedGoodImageUrl: string | null;
  finishedGoodShortDesc: string | null;
  finishedGoodLongDesc: string | null;
  wholesalePrice: number | null;
  retailPrice: number | null;
  dateRangeBegin: Date | null;
  dateRangeEnd: Date | null;
  enabled: boolean;
  product: Product;
  decoration: Product;
}

function getApiConfig(client: Client, environment: Environment): RepSparkConfig | null {
  const envMap = {
    dev: {
      baseUrl: "https://api.dev.repspark.net",
      clientKey: client.devClientKey,
      environmentKey: client.devEnvironmentKey,
    },
    uat: {
      baseUrl: "https://api.uat.repspark.net",
      clientKey: client.uatClientKey,
      environmentKey: client.uatEnvironmentKey,
    },
    prod: {
      baseUrl: "https://api.repspark.net",
      clientKey: client.prodClientKey,
      environmentKey: client.prodEnvironmentKey,
    },
  };

  const config = envMap[environment];
  if (!config.clientKey || !config.environmentKey) {
    return null;
  }

  return {
    baseUrl: config.baseUrl,
    clientKey: config.clientKey,
    environmentKey: config.environmentKey,
  };
}

function getAuthHeader(config: RepSparkConfig): string {
  const credentials = `${config.clientKey}:${config.environmentKey}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

function generateTransactionToken(): string {
  return crypto.randomUUID();
}

// ============================================================================
// PAYLOAD TRANSFORMERS
// ============================================================================

export function transformOptions(options: Option[]): Record<string, unknown>[] {
  return options.map((opt) => ({
    ElementType: opt.elementType,
    KeyCode: opt.keyCode,
    StringValue: opt.stringValue,
    Description: opt.stringValue,
    ...(opt.stringValue2 && { StringValue2: opt.stringValue2 }),
    ...(opt.numericValue !== null && { NumericValue: opt.numericValue }),
    ...(opt.booleanValue !== null && { BooleanValue: opt.booleanValue }),
    ...(opt.dateValue && { DateValue: opt.dateValue.toISOString() }),
    Enabled: opt.enabled,
  }));
}

export function transformSizing(
  sizeScales: (SizeScale & { sizes: Size[] })[]
): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = [];

  for (const scale of sizeScales) {
    for (const size of scale.sizes) {
      records.push({
        SizeScaleCode: scale.code,
        SizeScaleDescription: scale.description,
        SizeCode: size.code,
        SizeDescription: size.description,
        SizeIndex: size.index,
        ...(size.sizeTypes && { SizeTypes: JSON.parse(size.sizeTypes) }),
        BrandCode: scale.brandCode,
        Enabled: size.enabled,
        ...(scale.divisionCode && { DivisionCode: scale.divisionCode }),
      });
    }
  }

  return records;
}

export function transformProducts(products: Product[]): Record<string, unknown>[] {
  return products.map((p) => {
    const record: Record<string, unknown> = {
      ProductNumber: p.productNumber,
      WholesalePrice: p.wholesalePrice,
      RetailPrice: p.retailPrice,
      DiscountedPrice: p.discountedPrice,
      ProductType: p.productType,
      Enabled: p.enabled,
      IgnoreDiscounts: p.ignoreDiscounts,
      AssociationsPerGroup: p.associationsPerGroup,
      Weight: p.weight,
      StandardCost: p.standardCost,
      BrandCode: p.brandCode,
    };

    if (p.productName) record.ProductName = p.productName;
    if (p.longDescription) record.LongDescription = p.longDescription;
    if (p.shortDescription) record.ShortDescription = p.shortDescription;
    if (p.categoryCode) record.CategoryCode = p.categoryCode;
    if (p.colorCode) record.ColorCode = p.colorCode;
    if (p.genderCode) record.GenderCode = p.genderCode;
    if (p.seasonCode) record.SeasonCode = p.seasonCode;
    if (p.divisionCode) record.DivisionCode = p.divisionCode;
    if (p.catalogCode) record.CatalogCode = p.catalogCode;
    if (p.dimensionCode) record.DimensionCode = p.dimensionCode;
    if (p.marketingSeasonCode) record.MarketingSeasonCode = p.marketingSeasonCode;
    if (p.styleGroupCode) record.StyleGroupCode = p.styleGroupCode;
    if (p.imageUrl) record.ImageURL = p.imageUrl;

    return record;
  });
}

export function transformInventory(inventory: Inventory[]): Record<string, unknown>[] {
  return inventory.map((inv) => ({
    ProductNumber: inv.productNumber,
    SizeCode: inv.sizeCode,
    AvailableDate: inv.availableDate.toISOString().split("T")[0],
    AvailableQuantity: inv.availableQuantity,
    ReplenishmentQuantity: inv.replenishmentQuantity,
    InfiniteAvailability: inv.infiniteAvailability,
    CommittedQuantity: inv.committedQuantity,
    ...(inv.colorCode && { ColorCode: inv.colorCode }),
    ...(inv.genderCode && { GenderCode: inv.genderCode }),
    ...(inv.seasonCode && { SeasonCode: inv.seasonCode }),
    ...(inv.divisionCode && { DivisionCode: inv.divisionCode }),
    BrandCode: inv.brandCode,
    ...(inv.dimensionCode && { DimensionCode: inv.dimensionCode }),
    ...(inv.productCategoryCode && { ProductCategoryCode: inv.productCategoryCode }),
    ...(inv.locationCode && { LocationCode: inv.locationCode }),
  }));
}

export function transformCustomers(customers: Customer[]): Record<string, unknown>[] {
  return customers.map((c) => {
    const record: Record<string, unknown> = {
      CustomerCode: c.customerCode,
      Name: c.name,
      IsBillTo: c.isBillTo,
      Enabled: c.enabled,
      Country: c.country,
      DiscountPercentage: c.discountPercentage,
      CommissionPercentage: c.commissionPercentage,
    };

    if (!c.isBillTo && c.storeCode) {
      record.StoreCode = c.storeCode;
    }
    if (c.address1) record.Address1 = c.address1;
    if (c.address2) record.Address2 = c.address2;
    if (c.city) record.City = c.city;
    if (c.state) record.State = c.state;
    if (c.zip) record.Zip = c.zip;
    if (c.phoneNumber) record.PhoneNumber = c.phoneNumber;
    if (c.faxNumber) record.FaxNumber = c.faxNumber;
    if (c.salesPersonCode) record.SalesPersonCode = c.salesPersonCode;
    if (c.brandCode) record.BrandCode = c.brandCode;
    if (c.divisionCode) record.DivisionCode = c.divisionCode;
    if (c.termsCode) record.TermsCode = c.termsCode;
    if (c.shippingMethodCode) record.ShippingMethodCode = c.shippingMethodCode;
    if (c.pricePlanCode) record.PricePlanCode = c.pricePlanCode;
    if (c.customerGroupCode) record.CustomerGroupCode = c.customerGroupCode;
    if (c.classificationCode) record.ClassificationCode = c.classificationCode;
    if (c.channelCode) record.ChannelCode = c.channelCode;
    if (c.typeCode) record.TypeCode = c.typeCode;
    if (c.buyingGroupCode) record.BuyingGroupCode = c.buyingGroupCode;
    if (c.creditStatusCode) record.CreditStatusCode = c.creditStatusCode;
    if (c.dba) record.DBA = c.dba;
    if (c.paymentsVisibility) record.PaymentsVisibility = c.paymentsVisibility;
    if (c.referenceNumber) record.ReferenceNumber = c.referenceNumber;

    return record;
  });
}

export function transformProductGroups(
  configs: LicensedConfigWithRelations[]
): Record<string, unknown>[] {
  return configs.map((config) => {
    const baseProduct = config.product;  // Changed from config.baseProduct
    const logoProduct = config.decoration;

    // Build the ProductGroup
    const productGroup: Record<string, unknown> = {
      Products: [
        // Base product (Type 2)
        {
          ProductNumber: baseProduct.productNumber,
          ProductType: 2,
          ...(baseProduct.colorCode && { ColorCode: baseProduct.colorCode }),
          ...(baseProduct.genderCode && { GenderCode: baseProduct.genderCode }),
          ...(baseProduct.seasonCode && { SeasonCode: baseProduct.seasonCode }),
        },
        // Logo product (Type 4) with Extensions
        {
          ProductNumber: logoProduct.productNumber,
          ProductType: 4,
          ...(logoProduct.wholesalePrice && { WholesalePrice: logoProduct.wholesalePrice }),
          Extensions: [
            { ExtensionType: "Placement", Value: config.placement },
            { ExtensionType: "ColorChoice", Value: config.colorChoice },
          ],
        },
      ],
      Enabled: config.enabled,
    };

    // Finished good display name
    if (config.finishedGoodName) {
      productGroup.ProductName = config.finishedGoodName;
    } else {
      // Auto-generate: "Base Product Name - Team Name"
      const baseName = baseProduct.productName || baseProduct.productNumber;
      const teamName = logoProduct.teamName || logoProduct.productName || logoProduct.productNumber;
      productGroup.ProductName = `${baseName} - ${teamName}`;
    }

    // Optional finished good fields
    if (config.finishedGoodShortDesc) {
      productGroup.ShortDescription = config.finishedGoodShortDesc;
    }
    if (config.finishedGoodLongDesc) {
      productGroup.LongDescription = config.finishedGoodLongDesc;
    }
    if (config.finishedGoodImageUrl) {
      productGroup.ImageURL = config.finishedGoodImageUrl;
    }

    // Price overrides (if specified, otherwise RepSpark calculates base + logo)
    if (config.wholesalePrice !== null) {
      productGroup.WholesalePrice = config.wholesalePrice;
    }
    if (config.retailPrice !== null) {
      productGroup.RetailPrice = config.retailPrice;
    }

    // Date range availability
    if (config.dateRangeBegin) {
      productGroup.DateRangeBegin = config.dateRangeBegin.toISOString().split("T")[0];
    }
    if (config.dateRangeEnd) {
      productGroup.DateRangeEnd = config.dateRangeEnd.toISOString().split("T")[0];
    }

    // Inherit some codes from base product
    if (baseProduct.brandCode) productGroup.BrandCode = baseProduct.brandCode;
    if (baseProduct.divisionCode) productGroup.DivisionCode = baseProduct.divisionCode;
    if (baseProduct.seasonCode) productGroup.SeasonCode = baseProduct.seasonCode;
    if (baseProduct.categoryCode) productGroup.CategoryCode = baseProduct.categoryCode;

    return productGroup;
  });
}

// ============================================================================
// API CALLS
// ============================================================================

export interface SyncResult {
  success: boolean;
  recordCount: number;
  statusCode?: number;
  error?: string;
  details?: unknown;
}

export async function syncToRepSpark(
  client: Client,
  environment: Environment,
  entityType: "option" | "sizing" | "product" | "inventory" | "customer" | "productgroup",
  payload: Record<string, unknown>[],
  syncMode: "Full" | "Delta" = "Full"
): Promise<SyncResult> {
  const config = getApiConfig(client, environment);

  if (!config) {
    return {
      success: false,
      recordCount: 0,
      error: `Missing API credentials for ${environment} environment`,
    };
  }

  const transactionToken = generateTransactionToken();

  try {
    console.log(`RepSpark ${entityType} sync request:`, {
      url: `${config.baseUrl}/api/${entityType}`,
      syncMode,
      payloadCount: payload.length,
      payload: payload,
    });

    const response = await fetch(`${config.baseUrl}/api/${entityType}`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(config),
        "X-RepSpark-TransactionToken": transactionToken,
        "X-RepSpark-SyncMode": syncMode,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    console.log(`RepSpark ${entityType} raw response:`, {
      status: response.status,
      body: responseText.substring(0, 500),
    });

    let responseData: unknown;
    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseData = responseText.substring(0, 200);
    }

    if (response.ok) {
      return {
        success: true,
        recordCount: payload.length,
        statusCode: response.status,
        details: responseData,
      };
    } else {
      return {
        success: false,
        recordCount: payload.length,
        statusCode: response.status,
        error: `API returned ${response.status}`,
        details: responseData,
      };
    }
  } catch (error) {
    console.error(`RepSpark ${entityType} sync error:`, error);
    return {
      success: false,
      recordCount: payload.length,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function testConnection(
  client: Client,
  environment: Environment
): Promise<{ success: boolean; error?: string }> {
  const config = getApiConfig(client, environment);

  if (!config) {
    return {
      success: false,
      error: `Missing API credentials for ${environment} environment`,
    };
  }

  try {
    const response = await fetch(`${config.baseUrl}/api/option`, {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(config),
        "X-RepSpark-TransactionToken": generateTransactionToken(),
        "X-RepSpark-SyncMode": "Delta",
        "Content-Type": "application/json",
      },
      body: JSON.stringify([]),
    });

    if (response.ok || response.status === 200) {
      return { success: true };
    } else if (response.status === 401) {
      return { success: false, error: "Invalid credentials" };
    } else {
      return { success: false, error: `API returned ${response.status}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}
