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
  const groupedPrices = priceList.reduce((acc, item) => {
    if (!acc[item.groupAge]) {
      acc[item.groupAge] = [];
    }
    acc[item.groupAge].push(item);
    return acc;
  }, {} as Record<string, typeof priceList>);

  return (
    <Card data-testid="card-price-table">
      <CardHeader>
        <CardTitle>Price List</CardTitle>
        <CardDescription>
          Pricing based on group age and member count
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Group Age</TableHead>
                <TableHead className="min-w-[140px]">Member Range</TableHead>
                <TableHead className="text-right">Price (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedPrices).map(([age, prices]) => (
                prices.map((item, idx) => (
                  <TableRow key={`${age}-${item.memberRange}`}>
                    {idx === 0 && (
                      <TableCell
                        rowSpan={prices.length}
                        className="font-medium align-top"
                      >
                        {age}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {item.memberRange}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      ${item.price.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
