import { useQuery } from "@tanstack/react-query";
import { formsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/layout/TopBar";
import { FileText, Calendar, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";

export default function Forms() {
  const { user } = useAuthStore();
  const { data: forms = [] } = useQuery({ queryKey: ["bir-forms"], queryFn: formsApi.listBir });

  const grouped = forms.reduce((acc, form) => {
    if (!acc[form.category]) acc[form.category] = [];
    acc[form.category].push(form);
    return acc;
  }, {} as Record<string, typeof forms>);

  const categoryLabels: Record<string, string> = {
    income_tax: "Income Tax",
    withholding_tax: "Withholding Tax",
    vat: "Value-Added Tax",
    percentage_tax: "Percentage Tax",
    dst: "Documentary Stamp Tax",
    payments: "Payments",
  };

  return (
    <div className="h-full overflow-y-auto">
      <TopBar title="BIR Forms Library" />
      <div className="p-4 sm:p-6 space-y-6">
        <p className="text-sm text-muted-foreground">
          Reference library of BIR forms. Select a form to assign to a client as a filing task.
        </p>

        {Object.entries(grouped).map(([category, categoryForms]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-base capitalize flex items-center gap-2">
                <Filter size={16} className="text-primary" />
                {categoryLabels[category] || category}
                <Badge variant="outline" className="ml-2">{categoryForms.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryForms.map((form) => (
                  <div key={form.id} className="p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <FileText size={18} className="text-primary mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{form.formCode}</p>
                        <p className="text-xs text-muted-foreground truncate">{form.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {form.filingFrequency.replace("_", " ")}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar size={10} /> Due day {form.deadlineDay}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
