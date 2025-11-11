import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-6 w-[400px] text-center shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-800">
            CollabCode Frontend 🚀
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-600">Tailwind + Shadcn are working!</p>
          <Button>Click me</Button>
        </CardContent>
      </Card>
    </main>
  );
}
