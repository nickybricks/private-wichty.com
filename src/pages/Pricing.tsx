import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Percent, Euro, ArrowRight, Check } from "lucide-react";

export default function Pricing() {
  const { t } = useTranslation('common');
  const [ticketPrice, setTicketPrice] = useState<string>("10");
  const [passFeeToCustomer, setPassFeeToCustomer] = useState(false);

  const price = parseFloat(ticketPrice) || 0;
  const feePercent = 0.05; // 5%
  const minFee = 0.50;
  
  // Calculate fee (5%, minimum 0.50€)
  const calculatedFee = Math.max(price * feePercent, minFee);
  const actualFee = price > 0 ? calculatedFee : 0;

  // When fee is passed to customer
  const customerPays = passFeeToCustomer ? price + actualFee : price;
  const hostReceives = passFeeToCustomer ? price : price - actualFee;
  const wichtyReceives = actualFee;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return (
    <>
      <Helmet>
        <title>{t('pricing.pageTitle')} | Wichty</title>
        <meta name="description" content={t('pricing.pageDescription')} />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 py-8 md:py-16">
          <div className="max-w-[var(--max-width)] mx-auto px-4 md:px-8">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {t('pricing.title')}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('pricing.subtitle')}
              </p>
            </div>

            {/* Pricing Explanation */}
            <div className="grid gap-6 md:grid-cols-2 mb-12">
              <Card className="border-2 border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Percent className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold">{t('pricing.feeModel.title')}</h2>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    {t('pricing.feeModel.description')}
                  </p>
                  <div className="bg-background rounded-lg p-4 border">
                    <div className="text-2xl font-bold text-primary mb-1">
                      5% <span className="text-sm font-normal text-muted-foreground">{t('pricing.feeModel.perTicket')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t('pricing.feeModel.minimum')}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">{t('pricing.benefits.title')}</h2>
                  <ul className="space-y-3">
                    {['noPlatformFee', 'freeEvents', 'flexibleFees', 'instantPayout'].map((key) => (
                      <li key={key} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{t(`pricing.benefits.${key}`)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Calculator Section */}
            <div className="max-w-xl mx-auto">
              <h2 className="text-2xl font-bold text-center mb-6">
                {t('pricing.calculator.title')}
              </h2>
              
              <Card className="overflow-hidden">
                <CardContent className="p-6 space-y-6">
                  {/* Input */}
                  <div className="space-y-2">
                    <Label htmlFor="ticketPrice" className="text-sm font-medium">
                      {t('pricing.calculator.ticketPrice')}
                    </Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="ticketPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={ticketPrice}
                        onChange={(e) => setTicketPrice(e.target.value)}
                        className="pl-9 text-lg h-12"
                        placeholder="10.00"
                      />
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <Label htmlFor="passFee" className="text-sm font-medium cursor-pointer">
                        {t('pricing.calculator.passFeeToggle')}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t('pricing.calculator.passFeeDescription')}
                      </p>
                    </div>
                    <Switch
                      id="passFee"
                      checked={passFeeToCustomer}
                      onCheckedChange={setPassFeeToCustomer}
                    />
                  </div>

                  {/* Results */}
                  {price > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        {t('pricing.calculator.breakdown')}
                      </h3>
                      
                      <div className="space-y-3">
                        {/* Customer pays */}
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm text-muted-foreground">
                            {t('pricing.calculator.customerPays')}
                          </span>
                          <span className="font-semibold text-lg">
                            {formatCurrency(customerPays)}
                          </span>
                        </div>

                        <div className="flex justify-center">
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>

                        {/* Host receives */}
                        <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <span className="text-sm text-green-700 dark:text-green-400">
                            {t('pricing.calculator.youReceive')}
                          </span>
                          <span className="font-bold text-xl text-green-700 dark:text-green-400">
                            {formatCurrency(hostReceives)}
                          </span>
                        </div>

                        {/* Wichty fee */}
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm text-muted-foreground">
                            {t('pricing.calculator.wichtyFee')}
                          </span>
                          <span className="font-medium text-muted-foreground">
                            {formatCurrency(wichtyReceives)}
                          </span>
                        </div>

                        {/* Fee explanation */}
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          {passFeeToCustomer 
                            ? t('pricing.calculator.feePassedNote')
                            : t('pricing.calculator.feeDeductedNote')
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {price <= 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">{t('pricing.calculator.enterPrice')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
