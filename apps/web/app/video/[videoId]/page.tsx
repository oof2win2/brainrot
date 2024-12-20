import React from "react";
import VideoCard from "./VideoCard";

const EXAMPLE_DATA = [
  {
    text: "Gene regulation is",
    endTime: 5.004,
    startTime: 3.994,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "all about how",
    endTime: 5.642,
    startTime: 5.05,
    textColor: "red",
    strokeColor: "black",
  },
  {
    text: "cells control gene",
    endTime: 6.687,
    startTime: 5.724,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "expression, balancing energy",
    endTime: 8.707,
    startTime: 6.711,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "use by producing",
    endTime: 9.602,
    startTime: 8.789,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "proteins only when",
    endTime: 10.74,
    startTime: 9.66,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "needed. In bacteria",
    endTime: 12.458,
    startTime: 10.786,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "like E. coli,",
    endTime: 13.503,
    startTime: 12.528,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "gene regulation responds",
    endTime: 15.128,
    startTime: 13.828,
    textColor: "yellow",
    strokeColor: "black",
  },
  {
    text: "to environmental changes,",
    endTime: 16.556,
    startTime: 15.175,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "such as lactose",
    endTime: 17.648,
    startTime: 16.765,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "availability. The lac",
    endTime: 19.435,
    startTime: 17.671,
    textColor: "yellow",
    strokeColor: "black",
  },
  {
    text: "operon is a",
    endTime: 20.202,
    startTime: 19.517,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "prime example, where",
    endTime: 21.653,
    startTime: 20.26,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "the presence of",
    endTime: 22.268,
    startTime: 21.676,
    textColor: "yellow",
    strokeColor: "black",
  },
  {
    text: "lactose induces the",
    endTime: 23.441,
    startTime: 22.338,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "production of proteins",
    endTime: 24.532,
    startTime: 23.487,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "necessary for lactose",
    endTime: 25.763,
    startTime: 24.614,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "metabolism. \n\nDNA replication",
    endTime: 28.619,
    startTime: 25.798,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "is a semiconservative",
    endTime: 29.873,
    startTime: 28.7,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "process, meaning each",
    endTime: 31.336,
    startTime: 29.896,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "new DNA molecule",
    endTime: 32.531,
    startTime: 31.405,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "consists of one",
    endTime: 33.425,
    startTime: 32.566,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "old and one",
    endTime: 34.25,
    startTime: 33.495,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "new strand. Key",
    endTime: 36.049,
    startTime: 34.296,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "players include DNA",
    endTime: 37.245,
    startTime: 36.107,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "helicase, which unwinds",
    endTime: 38.917,
    startTime: 37.28,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "the DNA, and",
    endTime: 40.031,
    startTime: 38.963,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "DNA polymerase, which",
    endTime: 41.75,
    startTime: 40.078,
    textColor: "yellow",
    strokeColor: "black",
  },
  {
    text: "synthesizes new strands.",
    endTime: 43.526,
    startTime: 41.796,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "Mutations can occur",
    endTime: 45.488,
    startTime: 44.478,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "during this process,",
    endTime: 46.719,
    startTime: 45.569,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "leading to changes",
    endTime: 47.717,
    startTime: 46.893,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "in the genetic",
    endTime: 48.356,
    startTime: 47.764,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "code, which can",
    endTime: 49.459,
    startTime: 48.414,
    textColor: "yellow",
    strokeColor: "black",
  },
  {
    text: "be beneficial or",
    endTime: 50.399,
    startTime: 49.505,
    textColor: "yellow",
    strokeColor: "black",
  },
  {
    text: "harmful. Understanding these",
    endTime: 52.268,
    startTime: 50.457,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "mechanisms is crucial",
    endTime: 53.406,
    startTime: 52.315,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "for grasping how",
    endTime: 54.184,
    startTime: 53.453,
    textColor: "yellow",
    strokeColor: "black",
  },
  {
    text: "life operates at",
    endTime: 55.008,
    startTime: 54.265,
    textColor: "white",
    strokeColor: "black",
  },
  {
    text: "a molecular level!",
    endTime: 56.192,
    startTime: 55.043,
    textColor: "white",
    strokeColor: "black",
  },
];

export default function VideoPage({
  params: { videoId },
}: {
  params: { videoId: string };
}) {
  return (
    <div className="w-full h-screen p-4">
      <VideoCard data={EXAMPLE_DATA} />
    </div>
  );
}
