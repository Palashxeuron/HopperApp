const puppeteer = require("puppeteer");
const fs = require("fs");
const ejs = require("ejs");
const { dialog, app } = require("electron");
const path = require("node:path");

class ReportGenerator {
  constructor(mainWindow) {
    const userDataPath = app.getPath("userData");
    this.dataDir = path.join(userDataPath, "Hopper_AppData");
    console.log("Hopper_AppData Directory: ", this.dataDir);
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir);
    }
    this.mainWindow = mainWindow;
  }

  async generatePdf(data) {
    this.data = data;

    try {
      const filePath = `${this.dataDir}/${this.data.filename}.pdf`;
      const templateContent = this.#getTemplate();
      const htmlContent = ejs.render(templateContent, this.data);
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      await page.pdf({ path: filePath, format: "A4", printBackground: true });
      await browser.close();
      console.log("PDF generated successfully.");
    } catch (error) {
      console.log(error);
      throw new Error("Error in generating the PDF.");
    }
  }

  #getTemplate() {
    try {
      const templateType = this.data.reportTemplate;
      const templateContent = fs.readFileSync(
        path.join(__dirname, `./templates/${templateType}.ejs`),
        "utf8"
      );
      return templateContent;
    } catch (error) {
      console.log(error);
      throw new Error("Error in finding the template.");
    }
  }

  async #getFilePath() {
    try {
      const { canceled, filePath } = await dialog.showSaveDialog(
        this.mainWindow,
        {
          title: "Save PDF",
          defaultPath: path.join(app.getPath("documents"), "report.pdf"),
          filters: [{ name: "PDF Files", extensions: ["pdf"] }],
        }
      );
      return { canceled, filePath };
    } catch (error) {
      throw new Error("Error while accessing file path.");
    }
  }
}

module.exports = { ReportGenerator };
