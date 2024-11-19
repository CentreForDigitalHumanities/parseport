import { Routes } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { SpindleComponent } from './spindle/spindle.component';
import { AethelComponent } from './aethel/aethel.component';
import { SpindleAboutComponent } from './spindle/spindle-about/spindle-about.component';
import { SpindleNotationComponent } from './spindle/spindle-notation/spindle-notation.component';
import { ReferencesComponent } from './references/references.component';
import { SampleComponent } from './sample/sample.component';
import { MinimalistParserComponent } from './minimalist-parser/minimalist-parser.component';
import { MinimalistParserInputComponent } from './minimalist-parser/minimalist-parser-input/minimalist-parser-input.component';
import { MinimalistParserAboutComponent } from './minimalist-parser/minimalist-parser-about/minimalist-parser-about.component';
import { MinimalistParserReferencesComponent } from './minimalist-parser/minimalist-parser-references/minimalist-parser-references.component';
import { MinimalistParserBrowserComponent } from './minimalist-parser/minimalist-parser-browser/minimalist-parser-browser.component';
import { AboutComponent } from './about/about.component';

const routes: Routes = [
    {
        path: 'home',
        component: HomeComponent,
    },
    {
        path: 'spindle',
        children: [
            {
                path: 'about',
                component: SpindleAboutComponent
            },
            {
                path: 'notation',
                component: SpindleNotationComponent
            },
            {
                path: 'references',
                component: ReferencesComponent
            },
            {
                path: '',
                pathMatch: 'full',
                component: SpindleComponent
            },
            {
                path: '**',
                redirectTo: ''
            }
        ]
    },
    {
        path: 'aethel',
        children: [
            {
                path: 'sample/:sampleName',
                component: SampleComponent
            },
            {
                path: '',
                component: AethelComponent
            }
        ]
    },
    {
        path: 'minimalist-parser',
        children: [
            {
                path: 'home',
                component: MinimalistParserComponent
            },
            {
                path: 'parse',
                component: MinimalistParserInputComponent
            },
            {
                path: 'browse',
                component: MinimalistParserBrowserComponent
            },
            {
                path: 'about',
                component: MinimalistParserAboutComponent
            },
            {
                path: 'references',
                component: MinimalistParserReferencesComponent
            },
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'home'
            },
            {
                path: '**',
                redirectTo: ''
            }
        ]
    },
    {
        path: 'about',
        component: AboutComponent,
    },
    {
        path: 'references',
        component: ReferencesComponent,
    },
    {
        path: '',
        redirectTo: '/home',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: '/home'
    }
];

export { routes };
