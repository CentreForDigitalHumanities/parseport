import { Pipe, PipeTransform } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

const SYMBOL_MAPPING = {
    "▵": "△",
    "▾": "▼",
    "▴": "▲",
    "▿": "▽",
    "◇": "♢",
    "□": "□",
};

@Pipe({
    name: "proof",
    standalone: false
})
export class ProofPipe implements PipeTransform {
    transform(value: string): SafeHtml {

        // Object.keys() is not properly typed.
        const originalSymbols = Object.keys(
            SYMBOL_MAPPING,
        ) as (keyof typeof SYMBOL_MAPPING)[];

        for (const symbol of originalSymbols) {
            // Wrap all text in between a symbol and '(' with a <sup> tag.
            value = value.replace(
                new RegExp(`(${symbol})(.*?)\\(`, "g"),
                (match, p1, p2) => {
                    return `${p1}<sup>${p2}</sup>(`;
                },
            );

            // Replace symbols according to the SYMBOL_MAPPING object.
            value = value.replace(
                new RegExp(symbol, "g"),
                SYMBOL_MAPPING[symbol],
            );
        }

        // Replace arrows with implicature symbols
        value = value.replace(/⟶/g, " ⊸ ");

        // Wrap all variables (i.e. instances of 'c' followed by one or multiple numbers) in a <var> tag.
        value = value.replace(/(c\d+)/g, '<var>$1</var>');

        // Put the variable numbers in subscript.
        value = value.replace(/c(\d+)/g, "c<sub>$1</sub>");

        // Wrap all terms (i.e. words starting with capital letters) with a <span class="term"> tag.
        value = value.replace(/([A-Z][a-zA-z]*)/g, '<span class="term">$1</span>');

        return this.sanitizer.bypassSecurityTrustHtml(`<span class="proof">${value}</span>`);
    }

    constructor(private sanitizer: DomSanitizer) {}
}
