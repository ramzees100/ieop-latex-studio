
$("showTrashProjects").onclick = () => {
  dashboardCategory = "trash";
  renderDashboard();
};
 // blankTemplate is defined in templates.js.

// resumeTemplate is defined in templates.js.

// researchTemplate is defined in templates.js.

let creatingTemplateProject = false;

function openTemplateChooser() {
  if (!state || busy || creatingTemplateProject) return;

  if (!$("templateDialog").open) {
    $("templateDialog").showModal();
  }
}

$("dashboardNewProject").onclick = openTemplateChooser;

// The editor's New project button opens the same chooser.
$("newProject").onclick = openTemplateChooser;

for (const button of document.querySelectorAll(
  "#templateDialog [data-template]"
)) {
  button.onclick = async () => {
    if (busy || creatingTemplateProject) return;

    const type = button.dataset.template;

    const defaultNames = {
      blank: "Untitled document",
      resume: "My Resume",
      book: "My Book",
      article: "My Research Article"
    };

    const name = prompt("Project name:", defaultNames[type]);
    if (!name?.trim()) return;

    creatingTemplateProject = true;
    $("templateDialog").close();

    let createdId = null;

    try {
      await mutate(() => {
        const source = type === "book"
          ? bookMain
          : type === "resume"
            ? resumeTemplate
            : type === "article"
              ? researchTemplate
              : blankTemplate;

        const project = newProject(name.trim(), source);

        if (type === "book") {
          project.files.push(
            textFile("chapters/chapter1.tex", chapter1),
            textFile(
              "chapters/chapter2.tex",
              "\\chapter{Next Steps}\n\nWrite your second chapter here.\n"
            ),
            textFile("references.bib", refs)
          );
        } else if (type === "article") {
          project.files.push(textFile("references.bib", refs));
        }

        validateProject(project);

        state.projects.push(project);
        state.activeId = project.id;
        activePath = "main.tex";
        createdId = project.id;
      }, "Project created. You can start writing.");

      if (createdId && state.activeId === createdId) {
        $("projectsDashboard").hidden = true;
        $("editorWorkspace").hidden = false;

        requestAnimationFrame(() => {
          syncEditorScroll();
          $("editor").focus();
        });

        window.scrollTo(0, 0);
      }
    } finally {
      creatingTemplateProject = false;
    }
  };
}
$("backToProjects").onclick = showProjectsDashboard;

init().then(() => {
  showProjectsDashboard();
});
