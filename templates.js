"use strict";

// Generic starting documents. Loaded before app.js.

const article = String.raw`\documentclass[12pt]{article}
\usepackage{amsmath,graphicx}
\usepackage[margin=1in]{geometry}
\title{My IEOP Document}
\author{Your Name}
\begin{document}
\maketitle
\section{Introduction}
Welcome to IEOP LaTeX Studio.

\[ c=\lambda f \]

\end{document}`;

const bookMain = String.raw`\documentclass[12pt,oneside]{book}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{amsmath,graphicx}
\usepackage[margin=1in]{geometry}
\usepackage[hidelinks]{hyperref}

\title{My Book}
\author{Your Name}
\date{\today}

\begin{document}
\frontmatter
\maketitle
\tableofcontents

\mainmatter
\include{chapters/chapter1}
\include{chapters/chapter2}

\backmatter
\bibliographystyle{plain}
\bibliography{references}
\end{document}`;

const chapter1 = String.raw`\chapter{Introduction}
This is the first chapter. A sample reference is \cite{maxwell1865}.

\section{An equation}
\begin{equation}
c=\lambda f
\end{equation}

% Upload an image, then use Insert figure to include it.
`;

const refs = String.raw`@article{maxwell1865,
  author = {James Clerk Maxwell},
  title = {A Dynamical Theory of the Electromagnetic Field},
  journal = {Philosophical Transactions of the Royal Society of London},
  year = {1865},
  volume = {155},
  pages = {459--512}
}`;

const blankTemplate = String.raw`\documentclass[12pt]{article}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{amsmath,graphicx}
\usepackage[margin=1in]{geometry}

\begin{document}

% Start writing here.

\end{document}`;

const resumeTemplate = String.raw`\documentclass[11pt,letterpaper]{article}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage[margin=0.75in]{geometry}
\usepackage[hidelinks]{hyperref}
\usepackage{enumitem}

\pagestyle{empty}
\setlength{\parindent}{0pt}
\setlist[itemize]{leftmargin=*,itemsep=3pt}

\begin{document}

\begin{center}
{\LARGE\textbf{Your Name}}\\[6pt]
Your Professional Title\\[4pt]
City, State \textbullet{} Your Phone Number\\
\href{mailto:you@example.com}{you@example.com}
\end{center}

\section*{Professional Summary}
Write a short summary of your experience and skills.

\section*{Experience}
\textbf{Job Title} \hfill Start Date -- End Date\\
Company Name, Location
\begin{itemize}
  \item Describe a responsibility or achievement.
  \item Add a measurable result where possible.
\end{itemize}

\section*{Education}
\textbf{Degree and Field}\\
University Name \hfill Graduation Year

\section*{Skills}
List your relevant technical and professional skills.

\section*{Projects}
\textbf{Project Name}\\
Describe your contribution and results.

\end{document}`;

const researchTemplate = String.raw`\documentclass[12pt]{article}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{amsmath,graphicx}
\usepackage[margin=1in]{geometry}
\usepackage[hidelinks]{hyperref}

\title{Your Article Title}
\author{Your Name}
\date{\today}

\begin{document}
\maketitle

\begin{abstract}
Summarize the purpose, methods, results, and conclusions.
\end{abstract}

\section{Introduction}
Introduce your topic and relevant literature.
A sample citation is \cite{maxwell1865}.

\section{Methods}
Explain your methods.

\section{Results}
Present your results.

\section{Discussion}
Explain the meaning and limitations of your findings.

\section{Conclusion}
Summarize your conclusions.

\bibliographystyle{plain}
\bibliography{references}

\end{document}`;
