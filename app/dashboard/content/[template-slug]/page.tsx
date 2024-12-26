"use client";
import React, { useContext, useEffect, useState } from "react";
import FormSection from "./FormSection";
import OutputSection from "./OutputSection";
import { TEMPLATE } from "../../_components/TemplateListSection";
import template from "@/app/(data)/template";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { chatSession } from "@/utils/AiModel";
import { db } from "@/utils/db";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { AIOutput } from "@/utils/schema";
import { TotalUsageContext } from "@/app/(context)/TotalUsageContext";
import { useRouter } from "next/navigation";



interface PROPS{

    params: Promise<{
        "template-slug": string; // params is now a Promise
    }>;
}

function CreateNewContent(props:PROPS) {
    const [selectedTemplate, setSelectedTemplate] = useState<TEMPLATE | undefined>();
    const [loading, setLoading] = useState(false);
    const [aiOutput, setAIOutput] = useState<string>("");
    const { user } = useUser();
    const {totalUsage,setTotalUsage}=useContext(TotalUsageContext);
    const router  = useRouter()
    useEffect(() => {
        const fetchParams = async () => {
            const unwrappedParams = await props.params; // Unwrap the params Promise
            const slug = unwrappedParams["template-slug"]; // Access the unwrapped slug
            const templateFound = template?.find((item) => item.slug === slug); // Find the corresponding template
            setSelectedTemplate(templateFound); // Update state with the selected template
        };
        fetchParams(); // Trigger the asynchronous function
    }, [props.params]);
    const GenerateAIContent = async (formData: Record<string, any>) => {
        try {
            if(totalUsage>=100000){
                console.log("pls upgrade");
                router.push('/dashboard/billing');
                return ;
            }
            setLoading(true);
            const SelectedPrompt = selectedTemplate?.aiPrompt;
            const FinalAIPrompt = JSON.stringify(formData) + ", " + SelectedPrompt;

            const result = await chatSession.sendMessage(FinalAIPrompt);
            const resultText = await result?.response.text();

            setAIOutput(resultText);
            await SaveInDb(JSON.stringify(formData), selectedTemplate?.slug, resultText);
        } catch (error) {
            console.error("Error generating AI content:", error);
        } finally {
            setLoading(false);
        }
    };

    const SaveInDb = async (
        formData: string,
        slug: string | undefined,
        aiResp: string
    ) => {
        try {
            const result = await db.insert(AIOutput).values({
                formData: formData,
                templateSlug: slug ?? "",
                aiResponse: aiResp,
                createdBy: user?.primaryEmailAddress?.emailAddress ?? "unknown", 
                createdAt: moment().format("YYYY-MM-DD HH:mm:ss").toString(), // Standard timestamp format
            });
            console.log(result);
        } catch (error) {
            console.error("Error saving to database:", error);
        }
    };

    return (
        <div className="p-10">
            <Link href={"/dashboard"}>
                <Button className="bg-purple-500">
                    <ArrowLeft />
                    Back
                </Button>
            </Link>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-5">
                {/* Form Section */}
                <FormSection
                    selectedTemplate={selectedTemplate}
                    userFormInput={(v: any) => GenerateAIContent(v)}
                    loading={loading}
                />

                {/* Output Section */}
                <div className="col-span-2">
                    <OutputSection aiOutput={aiOutput} />
                </div>
            </div>
        </div>
    );
}

export default CreateNewContent;
