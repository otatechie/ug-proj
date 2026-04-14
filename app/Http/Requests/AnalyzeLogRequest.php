<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AnalyzeLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'log_content' => ['required', 'string', 'max:20000', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'log_content.required' => 'Please paste log content or upload a file.',
            'log_content.max' => 'Log content may not exceed 20,000 characters.',
        ];
    }
}
