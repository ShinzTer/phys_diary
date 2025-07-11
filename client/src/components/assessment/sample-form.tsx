import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sample, SampleResult } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

interface SampleFormProps {
  sample: Sample;
  studentId: number;
  assessmentMode?: boolean;
}

export function SampleForm({ sample, studentId, assessmentMode = true }: SampleFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [value, setValue] = useState<string>("");
  const [assessment, setAssessment] = useState<string>("good");
  const [comments, setComments] = useState<string>("");

  // Fetch previous sample results for this student and sample
  const { data: previousResults } = useQuery<SampleResult[]>({
    queryKey: [`/api/sample-results?userId=${studentId}&sampleId=${sample.id}`],
    enabled: !!studentId && !!sample.id,
  });

  // Calculate historical average
  const historicalAverage = previousResults && previousResults.length > 0
    ? (previousResults.reduce((sum, result) => sum + parseFloat(result.value), 0) / previousResults.length).toFixed(2)
    : "N/A";

  // Get the latest previous result
  const latestPreviousResult = previousResults && previousResults.length > 0
    ? previousResults.sort((a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime())[0]
    : null;

  // Mutation for saving sample result
  const saveResultMutation = useMutation({
    mutationFn: async (data: { userId: number; sampleId: number; value: string; assessment?: string; comments?: string; assessedBy?: number }) => {
      const res = await apiRequest("POST", "/api/sample-results", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Result saved",
        description: "The sample result has been saved successfully.",
      });
      setValue("");
      setComments("");
      // Refetch the previous results
      queryClient.invalidateQueries({ queryKey: [`/api/sample-results?userId=${studentId}&sampleId=${sample.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving result",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!value) {
      toast({
        title: "Missing value",
        description: "Please enter a result value",
        variant: "destructive",
      });
      return;
    }

    const resultData: any = {
      userId: studentId,
      sampleId: sample.id,
      value,
    };

    if (assessmentMode) {
      resultData.assessment = assessment;
      resultData.comments = comments;
      if (user?.role === "teacher") {
        resultData.assessedBy = user.id;
      }
    }

    saveResultMutation.mutate(resultData);
  };

  const handleViewHistory = () => {
    // This would typically open a modal or navigate to a history view
    toast({
      title: "History",
      description: `Previous measurements history for ${sample.name}`,
    });
  };

  return (
    <Card className="border border-gray-200 rounded-lg">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-medium">{sample.name}</h3>
          <Badge variant="outline" className="bg-green-100 text-green-800 font-semibold px-2 py-1">
            {sample.category}
          </Badge>
        </div>
        
        <div className="mb-4">
          <Label className="block text-sm font-medium text-gray-700 mb-1">
            Result ({sample.unit})
          </Label>
          <div className="flex">
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="rounded-r-none"
              placeholder={`Enter value in ${sample.unit}`}
            />
            <Button
              variant="outline"
              onClick={handleViewHistory}
              className="rounded-l-none border-l-0"
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {assessmentMode && (
          <>
            <div className="mb-4">
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                Assessment
              </Label>
              <Select
                value={assessment}
                onValueChange={setAssessment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assessment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Замечательно</SelectItem>
                  <SelectItem value="good">Хорошо</SelectItem>
                  <SelectItem value="satisfactory">Удовлетворительно</SelectItem>
                  <SelectItem value="poor">Плохо</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                Comments
              </Label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="h-24 resize-none"
                placeholder="Add assessment comments"
              />
            </div>
          </>
        )}
        
        {latestPreviousResult && (
          <div className="mt-4 text-gray-500 text-sm">
            <p>
              <span className="font-medium">Предыдущее значение:</span>{" "}
              {latestPreviousResult.value} {sample.unit}{" "}
              ({new Date(latestPreviousResult.assessedAt).toLocaleDateString()})
            </p>
            <p>
              <span className="font-medium">Среднее значение:</span>{" "}
              {historicalAverage} {sample.unit}
            </p>
          </div>
        )}
        
        <div className="mt-4">
          <Button 
            onClick={handleSubmit}
            disabled={saveResultMutation.isPending}
          >
            {saveResultMutation.isPending ? "Saving..." : "Save Result"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
