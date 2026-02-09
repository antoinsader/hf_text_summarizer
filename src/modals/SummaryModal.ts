import LlmSummaryPlugin from "main";
import { App, Modal, requestUrl } from "obsidian";

type FalconSummaryResponse = Array<{
	summary_text: string;
  }>;

export class FalconSummaryModel extends Modal {
	private text: string;
	private model_id: string;
	private api_url: string;
	private token: string;
	private plugin: LlmSummaryPlugin;

	constructor(app: App, text: string, plugin: LlmSummaryPlugin) {
		super(app);
		this.text = text;
		this.plugin = plugin;

		this.api_url = `https://router.huggingface.co/hf-inference/models/Falconsai/text_summarization`;
	}
	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", { text: "Falcon summarizer" });

		const token = this.plugin.settings.hf_token;
		const token_valid = this.plugin.settings.token_valid;

		if (!token_valid) {
			if (token == "") {
				contentEl.createEl("p", {
					text: "Please set token in the settings",
				});
			} else {
				contentEl.createEl("p", { text: "Your token is invalid" });
			}
			return;
		}
		const loadingEl = contentEl.createEl("p", { text: "Loading summary…", cls: "falcon-loading" });

		void  this.summarize_falcon(contentEl, loadingEl);
	}

	private async summarize_falcon(
		containerEl: HTMLElement, loadingEl: HTMLElement,
		max_length: number = 150,
		min_length: number = 40
	) {
		const token = this.plugin.settings.hf_token;
		try {
			const response = await requestUrl({
				url: this.api_url,
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					inputs: this.text,
					parameters: {
						max_length: 150,
						min_length: 40,
					},
				}),
			});
			const result = response.json as unknown as FalconSummaryResponse;

			if (response.status === 503) {
				console.error(
					`Model is sleeping. please try again later, result: ${JSON.stringify(result)}`
				);
				return;
			}

			if (response.status !== 200) {
				console.error("summarize_falcon Error: ", result);
				return;
			}

			containerEl.createEl("h3", { text: "Your summary" });
			const box = containerEl.createEl("div", { 
				cls: "falcon-summary-box" 
			}); 
			box.createEl("p", { text: result[0]?.summary_text });

			return;
		} catch (err) {
			console.error("summarize_falcon Error:", err);
			containerEl.createEl("p", {
				text: "There was an error, please try again later",
			});
		}finally{
			loadingEl.remove();
		}
	}

	onClose(): void {
		const { contentEl } = this;
		contentEl.empty();
	}
}
