"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function WorkflowBuilder() {
    return (
        <Card className="h-[500px]">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Workflow Builder</CardTitle>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Step
                </Button>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-full text-gray-400 border-2 border-dashed rounded-md m-4">
                <div className="text-center">
                    <p>Drag and drop steps here to define the workflow.</p>
                    <p className="text-xs mt-2">(Visualization library integration required)</p>
                </div>
            </CardContent>
        </Card>
    );
}
