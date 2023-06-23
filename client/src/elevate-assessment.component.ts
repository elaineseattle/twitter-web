/* eslint-disable @angular-eslint/use-component-view-encapsulation */
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Router } from '@angular/router';
import { AsyncData } from '@cigna/core/interfaces';
import { AuthService, UserInfoFacade } from '@cigna/dcm-customer-portal/auth';

import {
  AnswerOption,
  AnsweredQuestionItem,
  CustomerIdentifiers,
  QuestionnaireResponse,
  QuestionnaireFacade,
  QuestionnaireContentExtension,
} from '@cigna/shared/elevate/data-access';
import { AssessmentFacade } from '../+state/assessment.facade';
import {
  AssessmentCompletedResponse,
  AssessmentUi,
  QuestionType,
} from '../+state/models';
import {
  CardSelectorItem,
  SelectedInputItem,
  PAGES_URL_MAPPING,
} from '@cigna/dcm-customer-portal/shared/util';
import { SingleSelectionComponent } from '@cigna/shared/elevate/ui';
import get from 'lodash/get';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ModalComponent } from '@cigna/ui/modal';
import { CarePathFacade } from '@cigna/dcm-customer-portal/care-path/data-access';
import { TrackUtil } from '@cigna/analytics/ui';
import { Moment } from 'moment';

export interface ValueCoding {
  code: string;
  display: string;
  version: number;
}

@Component({
  selector: 'cigna-elevate-assessment',
  templateUrl: './elevate-assessment.component.html',
  styleUrls: ['./elevate-assessment.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ElevateAssessmentComponent implements OnInit, OnDestroy {
  @ViewChild(ModalComponent, { static: false }) moreInfoModal: ModalComponent;

  @Input() assessContent?: never;
  @Input() isInitial = false;
  @Input() parent = '';
  @Input() actionDefId?: string;

  @Output() completedResponse = new EventEmitter<AssessmentCompletedResponse>();
  @Output() backToNonElevatePage = new EventEmitter();

  constructor(
    private _assessmentFacade: AssessmentFacade,
    private _questionnaireFacade: QuestionnaireFacade,
    private _authentication: AuthService,
    private _carePathFacade: CarePathFacade,
    private _userInfoFacade: UserInfoFacade,
    private _router: Router,
    private _trackUtil: TrackUtil,
  ) {}

  @ViewChild('selectionComponent')
  selectionComponent: SingleSelectionComponent;
  QuestionType = QuestionType;
  options?: CardSelectorItem[];
  progressBarValue?: number;
  selections?: SelectedInputItem[] = [];
  apiAssessVal: AnsweredQuestionItem;
  customerIdentifiers?: CustomerIdentifiers;
  isBackDisabled = false;
  customerIdentifiersSubscription: Subscription;
  isRedFlag = false;

  hasPreviousQuestion$ = this._questionnaireFacade.questionnaireResponse$.pipe(
    map(
      (questionnaire: QuestionnaireResponse): boolean =>
        questionnaire.contained[0].item.length > 1 &&
        !(
          questionnaire.contained[0].item.length === 2 &&
          questionnaire.contained[0].item[0].extension?.find(
            (extension) =>
              extension.url?.includes('rendering-style') &&
              extension.valueString === 'elevate_mini_assessment_q1',
          )
        ),
    ),
  );

  firstName$ = this._authentication.firstName$;

  carePathLoaded$ = combineLatest([
    this._carePathFacade.loaded$,
    this._userInfoFacade.loaded$,
  ]).pipe(
    map(
      ([carePathLoaded, userInfoLoaded]) =>
        new AsyncData(carePathLoaded && userInfoLoaded),
    ),
  );

  assessmentUi$: Observable<
    AsyncData<AssessmentUi | undefined> | AsyncData<undefined | undefined>
  > = this._assessmentFacade.assessmentUi$.pipe(
    tap((assessmentUi) => {
      this.initializeQuestion(assessmentUi.data);
      if (assessmentUi.data) {
        this.progressBarValue = this.progressBarPercentage(
          assessmentUi.data.currentQuestionNumber,
          assessmentUi.data.totalQuestions,
        );
      }
      if (assessmentUi.data?.isInProgress === false) {
        this.isBackDisabled = true;
        const isRedFlag =
          !!assessmentUi.data?.linkId &&
          this.previousQuestion !== assessmentUi.data.linkId;
        if (!isRedFlag || assessmentUi.data.type !== QuestionType.Display) {
          this.completedResponse.emit({
            responseId: assessmentUi.data.id,
          });
        } else {
          this.isRedFlag = true;
        }
      } else if (
        assessmentUi.data?.linkId &&
        this.previousQuestion !== assessmentUi.data.linkId
      ) {
        this.previousQuestion = assessmentUi.data.linkId;
      }
      return assessmentUi;
    }),
  );

  previousQuestion?: string;

  ngOnInit() {
    this._questionnaireFacade.resetQuestionnaire();
    this.previousQuestion = undefined;
    this.customerIdentifiersSubscription = combineLatest([
      this._carePathFacade.carePathCustomerIdentifier$,
      this._userInfoFacade.profile$,
    ]).subscribe(([carePathInfo, userInfo]) => {
      this.customerIdentifiers = {
        ami: carePathInfo.amiId,
        cardExtension: carePathInfo.cardExtension,
        group: carePathInfo.accountNumber,
        enterpriseId: userInfo?.enterpriseId,
      };
    });
  }

  ngOnDestroy(): void {
    this.customerIdentifiersSubscription.unsubscribe();
    this._questionnaireFacade.closeQuestionnaire();
  }

  backButtonClick(hasPreviousQuestion: boolean) {
    if (hasPreviousQuestion) {
      this.loadPreviousQuestion();
    } else {
      this.backToNonElevatePage.emit();
    }
  }

  progressBarPercentage(
    currentQuestion?: number,
    totalQuestions?: number,
  ): number {
    let progressPercentage = 0;
    if (currentQuestion) {
      const numQuestions = get(
        this.assessContent,
        `${this.actionDefId}.totalQuestions`,
      );
      if (numQuestions) {
        progressPercentage = Math.round(
          ((currentQuestion - 1) / numQuestions) * 100,
        );
      } else if (totalQuestions) {
        progressPercentage = Math.round(
          ((currentQuestion - 1) / totalQuestions) * 100,
        );
      }
    }
    return progressPercentage;
  }

  loadPreviousQuestion() {
    this._questionnaireFacade.getPreviousQuestion();
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  processSelectedValue(
    selectedItems: SelectedInputItem[],
    assessmentUi: AssessmentUi,
  ) {
    const isSingleSelect =
      !assessmentUi.repeats && assessmentUi.type === QuestionType.CardLayout;
    let answeredOptions;
    if (assessmentUi.type === QuestionType.FreeText) {
      answeredOptions = [{ valueString: selectedItems[0].text }];
      selectedItems[0].linkId = assessmentUi.linkId;
      this.apiAssessVal = {
        linkId: assessmentUi.linkId,
        text: assessmentUi.questionTitle,
        answer: answeredOptions as AnswerOption[],
      };
    } else {
      const codes = selectedItems.map((sel) => sel.value);
      const otherText = selectedItems.find(
        (sel) => sel.text && sel.linkId === assessmentUi.linkId,
      )?.text;
      const options: AnswerOption[] = [];
      codes.forEach((c) => {
        const opt = assessmentUi.options?.find(
          (o) => o.valueCoding?.code === c,
        );
        if (opt) {
          options.push(opt);
        }
      });
      answeredOptions = options.map((value) => ({
        valueCoding: {
          version: `${value.valueCoding?.version}`,
          code: value.valueCoding?.code,
          display: value.valueCoding?.display,
        },
      }));
      if (assessmentUi.otherOption?.linkId) {
        let otherAnswer;
        if (otherText && otherText.length > 0) {
          otherAnswer = {
            linkId: assessmentUi.otherOption.linkId,
            answer: [
              {
                valueString: otherText,
              },
            ],
          };
        }
        const item = [];
        item.push({
          linkId: assessmentUi.normalOptionLinkId,
          answer: answeredOptions,
        });
        if (otherAnswer) {
          item.push(otherAnswer);
        }

        this.apiAssessVal = {
          linkId: assessmentUi.linkId,
          text: assessmentUi.questionTitle,
          answer: [],
          item: item as AnsweredQuestionItem[],
        };
      } else {
        this.apiAssessVal = {
          linkId: assessmentUi.linkId,
          text: assessmentUi.questionTitle,
          answer: answeredOptions as AnswerOption[],
        };
      }
    }

    this.updateSelectedValue(assessmentUi, selectedItems, isSingleSelect);
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  updateSelectedValue(
    assessmentUi: AssessmentUi,
    selectedItems: SelectedInputItem[],
    isSingleSelect: boolean,
  ) {
    if (
      isSingleSelect ||
      assessmentUi.type === QuestionType.FreeText ||
      assessmentUi.type === QuestionType.DatePicker
    ) {
      const existingIndex = this.getExistingIndex(assessmentUi.linkId);
      if (existingIndex > -1 && this.selections && this.selections.length > 0) {
        if (
          selectedItems[0].linkId === undefined ||
          (assessmentUi.type === QuestionType.FreeText &&
            (selectedItems[0].text || '').length < 1)
        ) {
          this.selections.splice(existingIndex, 1);
        } else {
          this.selections[existingIndex] = selectedItems[0];
        }
      } else {
        this.selections?.push(selectedItems[0]);
      }
    } else {
      const oldSelections = JSON.parse(JSON.stringify(this.selections)); // contains previous value
      this.selections = selectedItems.map((a) => ({
        value: a.value,
        text: a.text,
        linkId: a.linkId,
      }));

      if (assessmentUi.maxSelection) {
        // get the remaning ones from previous selection, this is needed for ranked max questions where selections are filtered
        const remaining = oldSelections.filter(
          (x: SelectedInputItem) => x.linkId !== assessmentUi.linkId,
        );
        // merge the new selections with the existing one
        this.selections = this.selections.concat(remaining);
      }
    }
  }

  processSelectedDate(momentDate: Moment | null, assessmentUi: AssessmentUi) {
    if (momentDate) {
      const date = momentDate.toDate();
      const formattedDate = this.getFormattedDate(date);
      const inputItem: SelectedInputItem[] = [
        {
          text: formattedDate,
          linkId: assessmentUi.linkId,
        },
      ];
      const val = [{ valueDate: formattedDate }];

      this.updateSelectedValue(assessmentUi, inputItem, false);
      this.apiAssessVal = {
        linkId: assessmentUi.linkId,
        text: assessmentUi.questionTitle,
        answer: val as AnswerOption[],
      };
    } else {
      this.selections = this.selections?.filter(
        (selection) => selection.linkId !== assessmentUi.linkId,
      );
    }
  }

  getFormattedDate(date: Date) {
    const year = date.getFullYear();
    let month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : `0${month}`;

    let day = date.getDate().toString();
    day = day.length > 1 ? day : `0${day}`;

    return `${year}-${month}-${day}`;
  }

  getExistingIndex(linkId: string) {
    return this.selections
      ? this.selections.findIndex((selection) => selection.linkId === linkId)
      : -1;
  }

  findSelection(assessmentUi: AssessmentUi) {
    const selectionForQuestion = this.selections?.filter(
      (selection) => selection.linkId === assessmentUi.linkId,
    );
    return selectionForQuestion?.[0];
  }

  getSelection(assessmentUi: AssessmentUi | null | undefined) {
    return assessmentUi?.maxSelection
      ? this.selections?.filter(
          (selection) => selection.linkId === assessmentUi?.linkId,
        )
      : this.selections;
  }

  hasSelectedOptions(assessmentUi: AssessmentUi) {
    return (
      (this.selections?.filter(
        (selection) => selection.linkId === assessmentUi.linkId,
      ).length || 0) > 0
    );
  }

  submitInterstitial(buttonUrl: string, assessmentUi: AssessmentUi) {
    if (this.isRedFlag) {
      this.completedResponse.emit({
        responseId: assessmentUi.id,
        buttonUrl,
      });
    } else {
      return this._questionnaireFacade.submitAnsweredQuestion(
        {
          linkId: assessmentUi.linkId,
          text: assessmentUi.questionTitle,
          answer: [],
        },
        this.customerIdentifiers,
      );
    }
  }

  submitQuestion(answer: AnsweredQuestionItem) {
    return this._questionnaireFacade.submitAnsweredQuestion(
      answer,
      this.customerIdentifiers,
    );
  }

  getOptionsText(options?: AnswerOption[]): string[] {
    return options?.map((option) => option.valueCoding?.display || '') || [];
  }

  initializeQuestion(assessment: AssessmentUi | undefined) {
    if (assessment?.options) {
      this.options = assessment.options.map((option) => {
        let freeTextLimit;
        let freeTextPlaceholder;
        let initialText;
        const linkId = assessment.linkId;
        const isFreeText = Boolean(
          option.valueCoding?.code &&
            option.valueCoding.code ===
              assessment.otherOption?.enableWhen?.[0].answerCoding?.code,
        );

        if (isFreeText) {
          freeTextLimit = option.maxLength || 48;
          freeTextPlaceholder = option.placeholderText || 'Other...';
          const otherText = this.selections?.find(
            (selection) => selection.value === option.valueCoding?.code,
          );
          initialText = otherText ? otherText.text : '';
        }

        const isExclusive =
          option.extension?.find((e: QuestionnaireContentExtension) =>
            e.url?.includes('questionnaire-optionExclusive'),
          )?.valueBoolean === true;

        return {
          title: this.getContent(
            option.valueCoding?.code || '',
            'answerText',
            {},
            option.valueCoding?.display,
          ),
          value: option.valueCoding?.code,
          freeTextLimit,
          freeTextPlaceholder,
          isReadOnly: undefined,
          isFreeText,
          isExclusive,
          initialText,
          linkId,
        };
      });
    }
  }

  getContent(
    assessmentUi: AssessmentUi | string,
    level2Key: string,
    replacements?: { [key: string]: string },
    fallback?: string,
  ): string {
    const level1Key =
      typeof assessmentUi !== 'string' ? assessmentUi.linkId : assessmentUi;

    const getContent = get(this.assessContent, `${level1Key}.${level2Key}`);
    let content = typeof getContent !== 'undefined' ? getContent : '';

    if (content && replacements) {
      for (const [search, replace] of Object.entries(replacements)) {
        content =
          search && replace ? content.replace(search, replace) : content;
      }
    }

    return content || !fallback ? content : fallback;
  }

  getContentQuestionLabel(assessmentUi: AssessmentUi): string {
    const maxSelection = assessmentUi.maxSelection
      ? assessmentUi.maxSelection
      : 1;
    const chooseText = this.getContent(assessmentUi, 'chooseText', {
      '{{number}}': String(maxSelection),
    });
    if (chooseText) {
      return chooseText;
    }
    if (assessmentUi.repeats) {
      return 'elevate.action.selectAll';
    }
    if (assessmentUi.type === 'choice') {
      return 'elevate.action.selectOne';
    }
    return '';
  }

  onClose() {
    if (PAGES_URL_MAPPING[this.parent]) {
      this._router.navigate([PAGES_URL_MAPPING[this.parent]]);
    } else {
      this._router.navigate([PAGES_URL_MAPPING['dashboard']]);
    }
  }

  sendCardClickEvent(questionNumber: number) {
    this._trackUtil.track('trackOptionSelected', questionNumber);
  }
}
