# Grokathon Diligence Pack

A source-traced first-pass diligence pack, built at the Grok Bot Real Estate Hackathon, London, 12 November 2026.

## Problem
First-pass diligence still produces reports in which headline numbers cannot be followed back to a document, a page or a survey answer. Reviewers spend their time checking the workings rather than the judgement, and the pack is hard to trust or reuse.

## What it does
- Takes a synthetic brief and survey for an invented site as input.
- Produces a short report, the brief's questions with a way through each one, and a request list.
- Builds a source register in which every material figure has a row, a source and a link to the passage.
- Lets you click a headline figure and land on its register row and the underlying passage.

## How to run
1. Clone this repo.
2. [Install and environment steps.]
3. Put the synthetic brief and survey in `/data`.
4. [How to open the report.]

## Stack
Grok Bot, Cursor, [Supabase, Parallel, Cognee, V7 as used].

## Data
All inputs in `/data` are synthetic or public. Nothing from a live transaction is included.

## Source register
Every material figure in the output has a row in `/register`, with a link back to the underlying passage.

## Demo
A two-minute video is in `/demo`. The key moment is clicking a figure and landing on its source.
