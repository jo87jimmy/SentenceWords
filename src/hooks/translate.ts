import { type Article, type Sentence, TranslateEngine } from "@/types/types.ts";
// import Baidu from "@/libs/translate/baidu";
// import { Translator } from "@/libs/translate/translator/index.ts";

export function getSentenceAllTranslateText(article: Article) {
  return article.sections.map(v => v.map(s => s.translate.trim()).filter(v => v).join(' \n')).filter(v => v).join(' \n\n');
}

export function getSentenceAllText(article: Article) {
  return article.sections.map(v => v.map(s => s.text).filter(v => v).join('\n')).filter(v => v).join('\n\n');
}

/***
 * @desc
 * @param article 文章实体
 * @param translateEngine 翻译引擎
 * @param allShow 是否翻译完所有之后才显示
 * @param progressCb 进度回调
 * */
export async function getNetworkTranslate(
  article: Article,
  translateEngine: TranslateEngine,
  allShow: boolean = false,
  progressCb?: (val: number) => void
) {
  console.warn("Network translation logic is disabled because @/libs/translate is missing.");
  // let translator: Translator
  // if (translateEngine === TranslateEngine.Baidu) {
  //   translator = new Baidu({
  //     config: {
  //       appid: "20230910001811857",
  //       key: "Xxe_yftQR3K3Ue43NQMC"
  //     }
  //   }) as any
  // }
  // ... rest of the code commented out or omitted ...
}
