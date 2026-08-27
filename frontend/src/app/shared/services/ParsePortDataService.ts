import { Subject, Observable } from "rxjs";

export interface ParsePortDataService<
    InputType,
    OutputType,
    LoadingType = boolean,
> {
    input$: Subject<InputType>;
    throttledInput$: Observable<InputType>;
    output$: Observable<OutputType | null>;
    loading$: Observable<LoadingType>;
}
