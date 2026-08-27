import { TestBed } from "@angular/core/testing";
import { ProofPipe } from "./proof.pipe";
import { DomSanitizer } from "@angular/platform-browser";

describe("ProofPipe", () => {
    let pipe: ProofPipe;

    beforeEach(async () => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: DomSanitizer,
                    useValue: {
                        bypassSecurityTrustHtml: (value: string) => value,
                    },
                },
            ],
        });
        const sanitizer = TestBed.inject(DomSanitizer);
        pipe = new ProofPipe(sanitizer);
    });

    it("create an instance", () => {
        expect(pipe).toBeTruthy();
    });

    it("should transform simple input", () => {
        const input = "□app(NP⟶NP)";
        const output = pipe.transform(input);
        const expected =
            '<span class="proof">□<sup>app</sup>(<span class="term">NP</span> ⊸ <span class="term">NP</span>)</span>';

        expect(output).toEqual(expected);
    });

    it("should transform terms with uppercase and lowercase letters", () => {
        const input = "Adjp";
        const output = pipe.transform(input);
        const expected = '<span class="proof"><span class="term">Adjp</span></span>';

        expect(output).toEqual(expected);
    });

    it("should transform single uppercase letters", () => {
        const input = "N";
        const output = pipe.transform(input);
        const expected = '<span class="proof"><span class="term">N</span></span>';

        expect(output).toEqual(expected);
    });
});
