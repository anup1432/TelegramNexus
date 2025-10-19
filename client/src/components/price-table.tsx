import { priceList } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PriceTable() {
  return (
    <Card data-testid="card-price-table">
      <CardHeader>
        <CardTitle>Price List</CardTitle>
        <CardDescription>
          Pricing based on group year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Year</TableHead>
                <TableHead className="text-right">Price (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceList.map((item) => (
                <TableRow key={item.year}>
                  <TableCell className="font-medium">
                    {item.year}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-primary">
                    ${item.price.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
